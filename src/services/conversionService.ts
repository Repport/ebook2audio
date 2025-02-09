
import { ChapterWithTimestamp, ProgressCallback } from "./conversion/types";
import { generateHash, splitTextIntoChunks } from "./conversion/utils";
import { checkCache, fetchFromCache, saveToCache } from "./conversion/cacheService";
import { processChunks, combineAudioChunks } from "./conversion/chunkProcessor";
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
    console.error('Received raw PDF data instead of text content');
    throw new Error('Invalid text content: Raw PDF data received. Please check PDF text extraction.');
  }

  if (text.length > MAX_TEXT_SIZE) {
    throw new Error(`Text content is too large (${(text.length / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${MAX_TEXT_SIZE / (1024 * 1024)}MB.`);
  }

  console.log('Converting text length:', text.length, 'with voice:', voiceId);
  console.log('Chapters:', chapters?.length || 0);

  const textHash = await generateHash(text, voiceId);

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

  // Create a new conversion record
  const { data: conversion, error: conversionError } = await supabase
    .from('text_conversions')
    .insert({
      text_hash: textHash,
      file_name: fileName,
      user_id: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (conversionError) throw conversionError;

  // Process text in chunks
  const textChunks = splitTextIntoChunks(text);
  console.log(`Split text into ${textChunks.length} chunks for parallel processing`);

  try {
    // Process all chunks
    const audioChunks = await processChunks(textChunks, voiceId, conversion.id, onProgressUpdate);

    // Combine audio chunks
    const combinedBuffer = combineAudioChunks(audioChunks);

    // Store in cache
    const { error: saveError } = await saveToCache(textHash, combinedBuffer, fileName);
    if (saveError) {
      console.error('Error storing conversion:', saveError);
    }

    if (onProgressUpdate) {
      onProgressUpdate(100, textChunks.length, textChunks.length);
    }

    return combinedBuffer;
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
};
