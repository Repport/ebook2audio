
import { supabase } from "@/integrations/supabase/client";
import { obfuscateData } from "./utils";
import { ProgressCallback } from "./types";

const MAX_CONCURRENT_REQUESTS = 3;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export async function processChunks(
  chunks: string[], 
  voiceId: string,
  onProgressUpdate?: ProgressCallback
): Promise<ArrayBuffer[]> {
  const results: ArrayBuffer[] = new Array(chunks.length);
  const processing = new Set<number>();
  let completed = 0;

  const processChunk = async (index: number): Promise<void> => {
    if (index >= chunks.length) return;

    processing.add(index);
    let retryCount = 0;

    while (retryCount <= MAX_RETRIES) {
      try {
        const obfuscatedText = obfuscateData(chunks[index]);
        const obfuscatedVoiceId = obfuscateData(voiceId);

        const response = await supabase.functions.invoke('convert-to-audio', {
          body: { 
            text: obfuscatedText, 
            voiceId: obfuscatedVoiceId,
            fileName: `chunk_${index}`,
            isChunk: true
          }
        });

        if (response.error) throw response.error;

        const { data } = response;
        if (!data?.audioContent) throw new Error('No audio content received');

        // Convert base64 to ArrayBuffer
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        results[index] = bytes.buffer;
        completed++;

        if (onProgressUpdate) {
          onProgressUpdate(0, chunks.length, completed);
        }

        processing.delete(index);
        
        // Process next chunk if available
        const nextIndex = Math.max(...Array.from(processing)) + 1;
        if (nextIndex < chunks.length && !processing.has(nextIndex)) {
          processChunk(nextIndex);
        }

        return;
      } catch (error) {
        console.error(`Error processing chunk ${index}, attempt ${retryCount + 1}:`, error);
        retryCount++;

        if (retryCount <= MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
        } else {
          throw error;
        }
      }
    }
  };

  // Start initial batch of concurrent requests
  const initialBatch = Math.min(MAX_CONCURRENT_REQUESTS, chunks.length);
  await Promise.all(
    Array.from({ length: initialBatch }, (_, i) => processChunk(i))
  );

  // Wait for all chunks to complete
  while (completed < chunks.length) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

export function combineAudioChunks(audioChunks: ArrayBuffer[]): ArrayBuffer {
  const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
  const combinedBuffer = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of audioChunks) {
    combinedBuffer.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  return combinedBuffer.buffer;
}
