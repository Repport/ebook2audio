
import { ChapterWithTimestamp, ProgressCallback } from "./conversion/types";
import { generateHash, splitTextIntoChunks } from "./conversion/utils";
import { checkCache, fetchFromCache, saveToCache } from "./conversion/cacheService";
import { processChunks, combineAudioChunks } from "./conversion/chunkProcessor";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ConversionQueue = Database['public']['Tables']['conversion_queue']['Row'];

const MAX_TEXT_SIZE = 30 * 1024 * 1024; // 30MB
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const BATCH_SIZE = 50; // Process chunks in smaller batches

async function retryOperation<T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    if (retryCount >= MAX_RETRIES) {
      throw err;
    }

    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount) + Math.random() * 1000;
    console.log(`Retry attempt ${retryCount + 1} after ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryOperation(operation, retryCount + 1);
  }
}

// New function to process chunks in batches
async function insertChunksBatch(chunks: { chunk_text: string; chunk_index: number }[], conversionId: string) {
  const batches = [];
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    batches.push(chunks.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    await retryOperation(async () => {
      const { error } = await supabase
        .from('conversion_chunks')
        .insert(
          batch.map(chunk => ({
            conversion_id: conversionId,
            chunk_text: chunk.chunk_text,
            chunk_index: chunk.chunk_index,
            status: 'pending'
          }))
        );

      if (error) {
        if (error.code === '57014') { // Statement timeout error
          console.error('Timeout error during chunk insertion, will retry with smaller batch');
          // Recursively try with smaller batches
          const midPoint = Math.floor(batch.length / 2);
          await insertChunksBatch(batch.slice(0, midPoint), conversionId);
          await insertChunksBatch(batch.slice(midPoint), conversionId);
        } else {
          throw error;
        }
      }
    });
    
    // Add a small delay between batches to prevent overloading
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

export const convertToAudio = async (
  text: string, 
  voiceId: string,
  chapters?: ChapterWithTimestamp[],
  fileName?: string,
  onProgressUpdate?: ProgressCallback
): Promise<ArrayBuffer> => {
  if (text.startsWith('%PDF')) {
    console.error('Received raw PDF data instead of text content');
    throw new Error('Invalid text content: Raw PDF data received. Please check PDF text extraction.');
  }

  if (text.length > MAX_TEXT_SIZE) {
    throw new Error(`Text content is too large (${(text.length / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${MAX_TEXT_SIZE / (1024 * 1024)}MB.`);
  }

  console.log('Converting text length:', text.length, 'with voice:', voiceId);
  console.log('Chapters:', chapters?.length || 0);

  const textHash = await generateHash(text, voiceId);
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  // Check cache first with retries
  const { storagePath, error: cacheError } = await checkCache(textHash);
  if (cacheError) throw cacheError;

  if (storagePath) {
    console.log('Found cached conversion, fetching from storage');
    if (onProgressUpdate) {
      onProgressUpdate(100, 1, 1);
    }
    
    const { data: audioData, error: fetchError } = await fetchFromCache(storagePath);
    if (fetchError) throw fetchError;
    if (!audioData) throw new Error('Failed to fetch audio data from cache');
    
    return audioData;
  }

  let queueEntryResult: ConversionQueue | null = null;
  let conversionId: string | null = null;

  try {
    // Check if conversion record already exists
    const { data: existingConversion, error: existingError } = await supabase
      .from('text_conversions')
      .select()
      .eq('text_hash', textHash)
      .single();

    if (existingError && !existingError.message.includes('No rows found')) {
      throw existingError;
    }

    if (existingConversion) {
      conversionId = existingConversion.id;
      console.log('Found existing conversion record:', conversionId);
    } else {
      // Create new conversion record
      const { data: newConversion, error: insertError } = await supabase
        .from('text_conversions')
        .insert({
          text_hash: textHash,
          file_name: fileName,
          user_id: userId,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      if (!newConversion) throw new Error('Failed to create conversion record');
      
      conversionId = newConversion.id;
      console.log('Created new conversion record:', conversionId);
    }

    // Add to queue if not already exists
    const { data: existingQueue, error: queueCheckError } = await supabase
      .from('conversion_queue')
      .select()
      .eq('text_hash', textHash)
      .eq('status', 'pending')
      .maybeSingle();

    if (queueCheckError) throw queueCheckError;

    if (!existingQueue) {
      queueEntryResult = await retryOperation(async () => {
        const { data, error } = await supabase
          .from('conversion_queue')
          .insert({
            text_hash: textHash,
            user_id: userId,
            priority: 1,
            status: 'pending'
          })
          .select()
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('Failed to create queue item');
        return data;
      });
    } else {
      queueEntryResult = existingQueue;
    }

    // Process text in chunks
    const textChunks = splitTextIntoChunks(text);
    console.log(`Split text into ${textChunks.length} chunks for parallel processing`);

    // Check for existing chunks
    const { data: existingChunks, error: chunksError } = await supabase
      .from('conversion_chunks')
      .select('chunk_index')
      .eq('conversion_id', conversionId);

    if (chunksError) throw chunksError;

    // Only insert chunks that don't exist yet
    const existingIndices = new Set(existingChunks?.map(chunk => chunk.chunk_index) || []);
    const newChunks = textChunks
      .map((chunk, index) => ({ chunk_text: chunk, chunk_index: index }))
      .filter(chunk => !existingIndices.has(chunk.chunk_index));

    if (newChunks.length > 0) {
      console.log(`Inserting ${newChunks.length} new chunks in batches`);
      await insertChunksBatch(newChunks, conversionId);
    }

    // Process all chunks
    const audioChunks = await processChunks(textChunks, voiceId, conversionId!, onProgressUpdate);

    // Combine audio chunks
    const combinedBuffer = combineAudioChunks(audioChunks);

    // Store in cache with retries
    const { error: saveError } = await saveToCache(textHash, combinedBuffer, fileName);
    if (saveError) {
      console.error('Error storing conversion:', saveError);
    }

    // Update queue status with retries
    if (queueEntryResult) {
      await retryOperation(async () => {
        const { error: updateError } = await supabase
          .from('conversion_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', queueEntryResult!.id);
        
        if (updateError) throw updateError;
      });
    }

    if (onProgressUpdate) {
      onProgressUpdate(100, textChunks.length, textChunks.length);
    }

    return combinedBuffer;
  } catch (err) {
    // Capture the error first
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    
    // Update queue status on failure
    if (queueEntryResult) {
      try {
        await retryOperation(async () => {
          const { error: updateError } = await supabase
            .from('conversion_queue')
            .update({
              status: 'failed',
              error_message: errorMessage,
              retries: (queueEntryResult!.retries || 0) + 1
            })
            .eq('id', queueEntryResult!.id);
          
          if (updateError) throw updateError;
        });
      } catch (updateErr) {
        console.error('Error updating queue status:', updateErr);
      }
    }

    console.error('Conversion error:', err);
    throw err;
  }
};
