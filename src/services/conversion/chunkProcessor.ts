
import { supabase } from "@/integrations/supabase/client";
import { obfuscateData } from "./utils";
import { ProgressCallback } from "./types";

const MAX_CONCURRENT_REQUESTS = 8; // Increased from 1 to 8 for parallel processing
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 2000;
const REQUEST_TIMEOUT = 45000;

interface ConvertToAudioResponse {
  data: {
    audioContent: string;
  } | null;
  error: Error | null;
}

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

  // Initialize chunks in database with queue status tracking
  await Promise.all(chunks.map((chunk, index) => 
    supabase.from('conversion_chunks').insert({
      conversion_id: conversionId,
      chunk_index: index,
      chunk_text: chunk,
      status: 'pending'
    })
  ));

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

        // Update chunk status to processing
        await supabase.rpc('update_chunk_status', {
          p_chunk_id: conversionId,
          p_status: 'processing'
        });

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

        // Clean and validate the base64 string
        const cleanBase64 = data.data.audioContent.replace(/[^A-Za-z0-9+/]/g, '');
        const paddedBase64 = cleanBase64.padEnd(Math.ceil(cleanBase64.length / 4) * 4, '=');

        try {
          const binaryString = atob(paddedBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          results[index] = bytes.buffer;
          completed++;

          // Update chunk status to completed
          await supabase.rpc('update_chunk_status', {
            p_chunk_id: conversionId,
            p_status: 'completed',
            p_audio_path: `chunk_${index}.mp3`
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
      await supabase.rpc('update_chunk_status', {
        p_chunk_id: conversionId,
        p_status: 'failed',
        p_error_message: error.message
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
