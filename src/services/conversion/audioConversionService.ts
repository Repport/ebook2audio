
import { supabase } from "@/integrations/supabase/client";
import { generateHash } from "./utils";
import { createConversion, updateConversionStatus } from "./conversionManager";
import { ChapterWithTimestamp } from "./types";
import { uploadToStorage } from "./storage/cacheStorage";
import { processConversionChunks } from "./chunkProcessingService";

export async function convertToAudio(
  text: string,
  voiceId: string,
  chapters?: ChapterWithTimestamp[],
  fileName?: string,
): Promise<{ audio: ArrayBuffer, id: string }> {
  console.log('Starting conversion process with:', {
    textLength: text?.length,
    voiceId,
    hasChapters: !!chapters,
    fileName
  });

  const textHash = await generateHash(text, voiceId);
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  try {
    // Create or get existing conversion
    console.log('Creating conversion record...');
    const conversionId = await createConversion(textHash, fileName, userId);
    console.log('Created conversion with ID:', conversionId);
    
    try {
      await updateConversionStatus(conversionId, 'processing');

      const audioBuffer = await processConversionChunks(text, voiceId, fileName, conversionId);
      
      // Save the final combined audio to storage
      const storagePath = `${userId}/${conversionId}.mp3`;
      const { error: uploadError } = await uploadToStorage(storagePath, audioBuffer);

      if (uploadError) {
        console.error('Error uploading final audio:', uploadError);
        throw uploadError;
      }

      // Update the conversion record with the storage path
      const { error: updateError } = await supabase
        .from('text_conversions')
        .update({ storage_path: storagePath })
        .eq('id', conversionId);

      if (updateError) {
        console.error('Error updating storage path:', updateError);
        throw updateError;
      }

      console.log('Conversion completed successfully');
      await updateConversionStatus(conversionId, 'completed');
      
      return { 
        audio: audioBuffer,
        id: conversionId
      };

    } catch (error) {
      console.error('Error during conversion:', {
        error,
        context: { conversionId, fileName }
      });
      await updateConversionStatus(conversionId, 'failed', error.message);
      throw error;
    }

  } catch (error) {
    console.error('Fatal error in convertToAudio:', {
      error,
      stack: error.stack,
      context: { fileName, textLength: text?.length }
    });
    throw error;
  }
}
