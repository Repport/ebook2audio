
import { supabase } from "@/integrations/supabase/client";
import { obfuscateData } from "./utils";
import { ProgressCallback } from "./types";

const MAX_CONCURRENT_REQUESTS = 1;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000;
const REQUEST_TIMEOUT = 30000;

interface ConvertToAudioResponse {
  data: {
    audioContent: string;
  } | null;
  error: Error | null;
}

export async function processChunks(
  chunks: string[], 
  voiceId: string,
  onProgressUpdate?: ProgressCallback
): Promise<ArrayBuffer[]> {
  const results: ArrayBuffer[] = new Array(chunks.length);
  const processing = new Set<number>();
  let completed = 0;
  let failedAttempts = new Map<number, number>();

  if (onProgressUpdate) {
    onProgressUpdate(0, chunks.length, 0);
  }

  const processChunk = async (index: number): Promise<void> => {
    if (index >= chunks.length) return;

    processing.add(index);
    const retryCount = failedAttempts.get(index) || 0;

    try {
      console.log(`Processing chunk ${index + 1}/${chunks.length}, size: ${chunks[index].length} characters`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      try {
        const obfuscatedText = obfuscateData(chunks[index]);
        const obfuscatedVoiceId = obfuscateData(voiceId);

        const { data, error } = await supabase.functions.invoke<ConvertToAudioResponse>('convert-to-audio', {
          body: { 
            text: obfuscatedText, 
            voiceId: obfuscatedVoiceId,
            fileName: `chunk_${index}`,
            isChunk: true
          }
        });

        clearTimeout(timeoutId);

        if (error) throw new Error(error.message);
        if (!data?.data?.audioContent) {
          console.error('No audio content in response:', data);
          throw new Error('No audio content received');
        }

        // Ensure the string is properly padded for base64
        const base64String = data.data.audioContent.replace(/\s/g, '');
        const paddedBase64 = base64String.padEnd(Math.ceil(base64String.length / 4) * 4, '=');

        try {
          const binaryString = atob(paddedBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          results[index] = bytes.buffer;
          completed++;

          if (onProgressUpdate) {
            const progressPercentage = Math.round((completed / chunks.length) * 100);
            onProgressUpdate(progressPercentage, chunks.length, completed);
          }

          processing.delete(index);
          failedAttempts.delete(index);
          
          const nextIndex = Math.max(...Array.from(processing), -1) + 1;
          if (nextIndex < chunks.length && !processing.has(nextIndex)) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Add small delay between chunks
            processChunk(nextIndex);
          }
        } catch (decodeError) {
          console.error(`Error decoding base64 for chunk ${index}:`, decodeError);
          throw new Error(`Failed to decode audio content: ${decodeError.message}`);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error(`Error processing chunk ${index}, attempt ${retryCount + 1}:`, error);
      
      const jitter = Math.random() * 500;
      const delay = Math.min(
        BASE_RETRY_DELAY * Math.pow(2, retryCount) + jitter,
        15000
      );

      failedAttempts.set(index, retryCount + 1);

      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying chunk ${index} in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return processChunk(index);
      } else {
        throw new Error(`Failed to process chunk ${index} after ${MAX_RETRIES} attempts`);
      }
    }
  };

  try {
    // Start with just one initial request to test the connection
    await processChunk(0);
    
    // If successful, process remaining chunks with controlled concurrency
    const remainingChunks = Array.from(
      { length: chunks.length - 1 }, 
      (_, i) => processChunk(i + 1)
    );

    await Promise.all(remainingChunks);
    
    return results;
  } catch (error) {
    console.error('Fatal error in chunk processing:', error);
    throw new Error(`Conversion failed: ${error.message}`);
  }
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
