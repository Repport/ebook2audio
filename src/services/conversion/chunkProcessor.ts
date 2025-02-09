
import { supabase } from "@/integrations/supabase/client";
import { obfuscateData } from "./utils";
import { ProgressCallback } from "./types";

const MAX_CONCURRENT_REQUESTS = 2;
const MAX_RETRIES = 5;
const BASE_RETRY_DELAY = 2000;
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

  // Update progress at the start
  if (onProgressUpdate) {
    onProgressUpdate(0, chunks.length, 0);
  }

  const processChunk = async (index: number): Promise<void> => {
    if (index >= chunks.length) return;

    processing.add(index);
    const retryCount = failedAttempts.get(index) || 0;

    try {
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

        // Convert base64 to ArrayBuffer
        const binaryString = atob(data.data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        results[index] = bytes.buffer;
        completed++;

        // Calculate and update progress
        if (onProgressUpdate) {
          const progressPercentage = Math.round((completed / chunks.length) * 100);
          onProgressUpdate(progressPercentage, chunks.length, completed);
        }

        processing.delete(index);
        failedAttempts.delete(index);
        
        // Process next chunk if available
        const nextIndex = Math.max(...Array.from(processing)) + 1;
        if (nextIndex < chunks.length && !processing.has(nextIndex)) {
          processChunk(nextIndex);
        }

        return;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error(`Error processing chunk ${index}, attempt ${retryCount + 1}:`, error);
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 1000;
      const delay = Math.min(
        BASE_RETRY_DELAY * Math.pow(2, retryCount) + jitter,
        30000 // Max delay of 30 seconds
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
    // Start initial batch of concurrent requests with limited concurrency
    const initialBatch = Math.min(MAX_CONCURRENT_REQUESTS, chunks.length);
    const initialPromises = Array.from(
      { length: initialBatch }, 
      (_, i) => processChunk(i)
    );

    await Promise.all(initialPromises);
    
    // Wait for all chunks to complete
    while (completed < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check for failed chunks that need retry
      const failedChunks = Array.from(failedAttempts.entries())
        .filter(([_, attempts]) => attempts < MAX_RETRIES);
      
      for (const [index] of failedChunks) {
        if (!processing.has(index)) {
          processChunk(index);
        }
      }
    }

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

