
import { supabase } from "@/integrations/supabase/client";
import { generateHash } from "./utils";
import { createConversion, updateConversionStatus } from "./conversionManager";
import { ChapterWithTimestamp } from "./types";
import { uploadToStorage } from "./storage/cacheStorage";
import { processConversionChunks } from "./chunkProcessingService";
import { createChunksForConversion } from "./chunkManager";
import { TextChunkCallback } from "./types/chunks";

export async function convertToAudio(
  text: string,
  voiceId: string,
  chapters?: ChapterWithTimestamp[],
  fileName?: string,
  onProgress?: TextChunkCallback
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
    console.log('Creating conversion record...');
    const { data: conversionRecord, error: insertError } = await supabase
      .from('text_conversions')
      .insert({
        user_id: userId,
        status: 'processing',
        file_name: fileName,
        text_hash: textHash,
        progress: 0,
        notify_on_complete: false
      })
      .select()
      .single();

    if (insertError || !conversionRecord) {
      console.error('Error creating conversion record:', insertError);
      throw new Error('Failed to create conversion record');
    }

    const conversionId = conversionRecord.id;
    console.log('Created conversion with ID:', conversionId);
    
    try {
      await updateConversionStatus(conversionId, 'processing');

      // Crear chunks para la conversión
      const chunks = await createChunksForConversion(conversionId, text);
      console.log(`Created ${chunks.length} chunks for processing`);

      // Procesar chunks y obtener audio combinado
      const { data, error } = await supabase.functions.invoke('convert-to-audio', {
        body: {
          text,
          voiceId,
          fileName,
          conversionId,
          onProgress // Pasar el callback al edge function
        },
      });

      if (error) {
        console.error('Error in text-to-speech conversion:', error);
        throw error;
      }

      if (!data?.audioContent) {
        throw new Error('No audio content received from conversion');
      }

      // Convertir base64 a ArrayBuffer
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = bytes.buffer;

      // Guardar el audio final en storage
      const storagePath = `${userId}/${conversionId}.mp3`;
      console.log('Uploading audio to storage path:', storagePath);
      
      const { error: uploadError } = await uploadToStorage(storagePath, audioBuffer);

      if (uploadError) {
        console.error('Error uploading final audio:', uploadError);
        throw uploadError;
      }

      // Actualizar el registro de conversión
      const { error: updateError } = await supabase
        .from('text_conversions')
        .update({ 
          storage_path: storagePath,
          status: 'completed',
          progress: 100
        })
        .eq('id', conversionId);

      if (updateError) {
        console.error('Error updating storage path:', updateError);
        throw updateError;
      }

      console.log('Conversion completed successfully');
      
      // Si hay un callback de progreso, notificar que hemos terminado
      if (onProgress) {
        onProgress(text, text.length, text.length);
      }
      
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
