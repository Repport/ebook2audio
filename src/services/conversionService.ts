
import { ChapterWithTimestamp, ProgressCallback } from "./conversion/types";
import { generateHash, splitTextIntoChunks } from "./conversion/utils";
import { checkCache, fetchFromCache, saveToCache } from "./conversion/cacheService";
import { processChunks } from "./conversion/processors/chunkProcessor";
import { combineAudioChunks } from "./conversion/utils/audioUtils";
import { addToQueue, updateQueueStatus } from "./conversion/queueService";
import { createConversion, updateConversionStatus } from "./conversion/conversionManager";
import { insertChunksBatch, getExistingChunks } from "./conversion/chunkManager";
import { supabase } from "@/integrations/supabase/client";

const MAX_TEXT_SIZE = 30 * 1024 * 1024; // 30MB

export const convertToAudio = async (
  text: string, 
  voiceId: string,
  chapters?: ChapterWithTimestamp[],
  fileName?: string,
  onProgressUpdate?: ProgressCallback
): Promise<ArrayBuffer> => {
  if (text.startsWith('%PDF')) {
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

  // Check cache first
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

  let queueEntry = null;
  let conversionId: string | null = null;

  try {
    // Create or get existing conversion record
    conversionId = await createConversion(textHash, fileName, userId);
    console.log('Conversion record ID:', conversionId);

    // Update status to processing
    await updateConversionStatus(conversionId, 'processing');

    // Add to queue
    queueEntry = await addToQueue(textHash, userId);

    // Process text in chunks
    const textChunks = splitTextIntoChunks(text);
    console.log(`Split text into ${textChunks.length} chunks for parallel processing`);

    // Check for existing chunks
    const existingIndices = new Set(await getExistingChunks(conversionId));

    // Only insert chunks that don't exist yet
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

    // Store in cache
    const { error: saveError } = await saveToCache(textHash, combinedBuffer, fileName);
    if (saveError) {
      console.error('Error storing conversion:', saveError);
      await updateConversionStatus(conversionId, 'failed', saveError.message);
      throw saveError;
    }

    // Update conversion status to completed
    await updateConversionStatus(conversionId, 'completed');

    // Update queue status
    if (queueEntry) {
      await updateQueueStatus(queueEntry.id, 'completed');
    }

    if (onProgressUpdate) {
      onProgressUpdate(100, textChunks.length, textChunks.length);
    }

    return combinedBuffer;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    
    if (conversionId) {
      await updateConversionStatus(conversionId, 'failed', errorMessage);
    }
    
    if (queueEntry) {
      await updateQueueStatus(queueEntry.id, 'failed', errorMessage);
    }

    console.error('Conversion error:', err);
    throw err;
  }
};
