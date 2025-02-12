
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

      // Call the convert-to-audio edge function
      const { data, error } = await supabase.functions.invoke('convert-to-audio', {
        body: {
          text,
          voiceId,
          fileName
        }
      });

      if (error) {
        console.error('Conversion error:', error);
        throw error;
      }

      if (!data?.audioContent) {
        throw new Error('No audio content received from conversion');
      }

      // Convert base64 to ArrayBuffer
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBuffer = bytes.buffer;

      // Save the final audio to storage
      const storagePath = `${userId}/${conversionId}.mp3`;
      const { error: uploadError } = await uploadToStorage(storagePath, audioBuffer);

      if (uploadError) {
        console.error('Error uploading final audio:', uploadError);
        throw uploadError;
      }

      // Update the conversion record
      const { error: updateError } = await supabase
        .from('text_conversions')
        .update({ 
          storage_path: storagePath,
          status: 'completed'
        })
        .eq('id', conversionId);

      if (updateError) {
        console.error('Error updating storage path:', updateError);
        throw updateError;
      }

      // Trigger notification if user is authenticated
      if (userId) {
        try {
          const { error: notificationError } = await supabase.functions.invoke('send-conversion-notification', {
            body: { conversion_id: conversionId }
          });

          if (notificationError) {
            console.error('Error sending notification:', notificationError);
          }
        } catch (error) {
          console.error('Error invoking notification function:', error);
        }
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
