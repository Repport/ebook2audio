
import { supabase } from "@/integrations/supabase/client";
import { updateChunkStatus } from "../database/chunkDatabase";
import { decodeBase64Audio } from "../utils/audioUtils";
import { ConvertToAudioResponse, ProgressCallback } from "../types/chunks";

const MAX_CONCURRENT_REQUESTS = 8;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 2000;

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

  if (onProgressUpdate) {
    onProgressUpdate(0, chunks.length, 0);
  }

  const processChunk = async (index: number): Promise<void> => {
    if (index >= chunks.length) return;

    processing.add(index);
    const retryCount = failedAttempts.get(index) || 0;

    try {
      console.log(`Processing chunk ${index + 1}/${chunks.length}, size: ${chunks[index].length} characters`);
      
      // Get chunk timeout from database
      const { data: chunkData, error: chunkError } = await supabase
        .from('conversion_chunks')
        .select('timeout_ms')
        .eq('conversion_id', conversionId)
        .eq('chunk_index', index)
        .single();

      if (chunkError) throw chunkError;

      const timeout = chunkData?.timeout_ms || 120000; // Default to 120s if not set
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // Update chunk status to processing
        await updateChunkStatus({
          conversion_id: conversionId,
          chunk_index: index,
          status: 'processing',
          chunk_text: chunks[index]
        });

        const { data, error } = await supabase.functions.invoke<ConvertToAudioResponse>('convert-to-audio', {
          body: { 
            text: chunks[index], 
            voiceId,
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

        try {
          results[index] = decodeBase64Audio(data.data.audioContent);
          completed++;

          // Update chunk status to completed
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
          
          // Process next chunk if under concurrent limit
          const nextAvailableIndex = chunks.findIndex((_, i) => 
            !processing.has(i) && !results[i] && (!failedAttempts.has(i) || failedAttempts.get(i)! < MAX_RETRIES)
          );

          if (nextAvailableIndex !== -1 && processing.size < MAX_CONCURRENT_REQUESTS) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay between chunks
            processChunk(nextAvailableIndex);
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
      
      // Update chunk status to failed
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
    // Start initial batch of concurrent requests
    const initialBatch = Math.min(chunks.length, MAX_CONCURRENT_REQUESTS);
    const initialPromises = [];
    
    for (let i = 0; i < initialBatch; i++) {
      initialPromises.push(processChunk(i));
    }
    
    await Promise.all(initialPromises);
    
    // Process remaining chunks as slots become available
    for (let i = initialBatch; i < chunks.length; i++) {
      if (processing.size < MAX_CONCURRENT_REQUESTS) {
        await processChunk(i);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Fatal error in chunk processing:', error);
    throw new Error(`Conversion failed: ${error.message}`);
  }
}

export { combineAudioChunks } from '../utils/audioUtils';

