
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
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
        notify_on_complete: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        total_characters: text.length,
        processed_characters: 0,
        total_chunks: Math.ceil(text.length / 4800),
        processed_chunks: 0
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
      // Llamar a la edge function para convertir
      const { data, error } = await supabase.functions.invoke('convert-to-audio', {
        body: {
          text,
          voiceId,
          fileName,
          conversionId
        },
      });

      if (error) {
        console.error('Error in text-to-speech conversion:', error);
        // Actualizar estado de error
        await supabase
          .from('text_conversions')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', conversionId);
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

      // Actualizar estado final
      await supabase
        .from('text_conversions')
        .update({
          status: 'completed',
          progress: 100,
          processed_characters: text.length,
          processed_chunks: Math.ceil(text.length / 4800)
        })
        .eq('id', conversionId);

      console.log('Conversion completed successfully');
      
      return { 
        audio: bytes.buffer,
        id: conversionId
      };

    } catch (error) {
      console.error('Error during conversion:', error);
      // Actualizar estado de error
      await supabase
        .from('text_conversions')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', conversionId);
      throw error;
    }

  } catch (error) {
    console.error('Fatal error in convertToAudio:', error);
    throw error;
  }
}
