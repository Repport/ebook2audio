
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
      .maybeSingle();

    if (existingError) throw existingError;

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

    // Add to queue
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

    // Process text in chunks
    const textChunks = splitTextIntoChunks(text);
    console.log(`Split text into ${textChunks.length} chunks for parallel processing`);

    // Process all chunks
    const audioChunks = await processChunks(textChunks, voiceId, conversionId, onProgressUpdate);

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
