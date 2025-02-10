
import { ChapterWithTimestamp, ProgressCallback } from "./conversion/types";
import { generateHash } from "./conversion/utils";
import { checkCache, fetchFromCache, saveToCache } from "./conversion/cacheService";
import { createConversion, updateConversionStatus } from "./conversion/conversionManager";
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

  let conversionId: string | null = null;

  try {
    // Create or get existing conversion record
    conversionId = await createConversion(textHash, fileName, userId);
    console.log('Conversion record ID:', conversionId);

    // Update status to processing
    await updateConversionStatus(conversionId, 'processing');

    // Convert text to audio using edge function
    const { data, error } = await supabase.functions.invoke<{ data: { audioContent: string } }>(
      'convert-to-audio',
      {
        body: { 
          text,
          voiceId,
          fileName,
          isChunk: false
        }
      }
    );

    if (error) throw error;
    if (!data?.data?.audioContent) {
      throw new Error('No audio content received from conversion');
    }

    // Decode the base64 audio content
    const audioBuffer = Buffer.from(data.data.audioContent, 'base64');
    
    // Store in cache
    const { error: saveError } = await saveToCache(textHash, audioBuffer, fileName);
    if (saveError) {
      console.error('Error storing conversion:', saveError);
      await updateConversionStatus(conversionId, 'failed', saveError.message);
      throw saveError;
    }

    // Update conversion status to completed
    await updateConversionStatus(conversionId, 'completed');

    if (onProgressUpdate) {
      onProgressUpdate(100, 1, 1);
    }

    return audioBuffer;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    
    if (conversionId) {
      await updateConversionStatus(conversionId, 'failed', errorMessage);
    }
    
    console.error('Conversion error:', err);
    throw err;
  }
};
