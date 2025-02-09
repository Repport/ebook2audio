
import { supabase } from "@/integrations/supabase/client";
import { updateChunkStatus } from "../database/chunkDatabase";
import { decodeBase64Audio } from "../utils/audioUtils";
import { ConvertToAudioResponse, ProgressCallback } from "../types/chunks";

const MAX_CONCURRENT_REQUESTS = 8;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 2000;
const CHUNK_DELAY = 200; // Reduced delay between chunks

export async function processChunks(
  chunks: string[], 
  voiceId: string,
  conversionId: string,
  onProgressUpdate?: ProgressCallback
): Promise<ArrayBuffer[]> {
  const results: ArrayBuffer[] = new Array(chunks.length);
  const processing = new Set<number>();
  let completed = 0;
  let failedAttempts = new Map<number, number>();
  
  // Create a queue for managing chunks
  const queue = chunks.map((_, index) => index);
  const activePromises = new Set<Promise<void>>();

  const processChunk = async (index: number): Promise<void> => {
    if (processing.has(index)) return;
    
    processing.add(index);
    const retryCount = failedAttempts.get(index) || 0;

    try {
      console.log(`Processing chunk ${index + 1}/${chunks.length}`);
      
      // Get chunk timeout from database
      const { data: chunkData } = await supabase
        .from('conversion_chunks')
        .select('timeout_ms')
        .eq('conversion_id', conversionId)
        .eq('chunk_index', index)
        .single();

      const timeout = chunkData?.timeout_ms || 120000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Update chunk status to processing
      await updateChunkStatus({
        conversion_id: conversionId,
        chunk_index: index,
        status: 'processing',
        chunk_text: chunks[index]
      });

      const { data, error } = await supabase.functions.invoke<ConvertToAudioResponse>(
        'convert-to-audio',
        {
          body: { 
            text: chunks[index], 
            voiceId,
            fileName: `chunk_${index}`,
            isChunk: true
          }
        }
      );

      clearTimeout(timeoutId);

      if (error) throw new Error(error.message);
      if (!data?.data?.audioContent) {
        throw new Error('No audio content received');
      }

      const audioBuffer = decodeBase64Audio(data.data.audioContent);
      if (!audioBuffer || audioBuffer.byteLength === 0) {
        throw new Error('Invalid audio data received');
      }

      results[index] = audioBuffer;
      completed++;

      await updateChunkStatus({
        conversion_id: conversionId,
        chunk_index: index,
        status: 'completed',
        audio_path: `chunk_${index}.mp3`,
        chunk_text: chunks[index]
      });

      if (onProgressUpdate) {
        const progressPercentage = Math.round((completed / chunks.length) * 100);
        onProgressUpdate(progressPercentage, chunks.length, completed);
      }

      processing.delete(index);
      failedAttempts.delete(index);

    } catch (error) {
      console.error(`Error processing chunk ${index}:`, error);
      
      await updateChunkStatus({
        conversion_id: conversionId,
        chunk_index: index,
        status: 'failed',
        error_message: error.message,
        chunk_text: chunks[index]
      });

      const jitter = Math.random() * 1000;
      const delay = Math.min(
        BASE_RETRY_DELAY * Math.pow(2, retryCount) + jitter,
        30000
      );

      failedAttempts.set(index, retryCount + 1);
      processing.delete(index);

      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying chunk ${index} in ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        queue.unshift(index); // Add back to queue for retry
      } else {
        throw new Error(`Failed to process chunk ${index} after ${MAX_RETRIES} attempts`);
      }
    }
  };

  // Process chunks in parallel with controlled concurrency
  while (queue.length > 0 || activePromises.size > 0) {
    while (queue.length > 0 && activePromises.size < MAX_CONCURRENT_REQUESTS) {
      const index = queue.shift()!;
      const promise = processChunk(index)
        .then(() => activePromises.delete(promise));
      activePromises.add(promise);
      
      // Small delay between starting new chunks to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, CHUNK_DELAY));
    }
    
    // Wait for at least one promise to complete before continuing
    if (activePromises.size >= MAX_CONCURRENT_REQUESTS || (queue.length === 0 && activePromises.size > 0)) {
      await Promise.race(Array.from(activePromises));
    }
  }

  // Validate all chunks were processed successfully
  const missingChunks = results.findIndex(chunk => !chunk || chunk.byteLength === 0);
  if (missingChunks !== -1) {
    throw new Error(`Chunk ${missingChunks} failed to process correctly`);
  }

  return results;
}
