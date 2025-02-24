
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
import { generateHash, splitTextIntoChunks } from "./utils";
import { createConversion, updateConversionStatus } from "./conversionManager";
import { ChapterWithTimestamp } from "./types";
import { uploadToStorage } from "./storage/cacheStorage";
import { processConversionChunks } from "./chunkProcessingService";
import { createChunksForConversion } from "./chunkManager";
import { TextChunkCallback } from "./types/chunks";

const CHUNK_SIZE = 4800;

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
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (insertError || !conversionRecord) {
      console.error('Error creating conversion record:', insertError);
      throw new Error('Failed to create conversion record');
    }

    const conversionId = conversionRecord.id;
    console.log('Created conversion with ID:', conversionId);

    // Dividir el texto en chunks aquí, antes de enviarlo
    const chunks = splitTextIntoChunks(text, CHUNK_SIZE);
    console.log(`Text split into ${chunks.length} chunks`);
    
    const totalChunks = chunks.length;
    const audioBuffers: ArrayBuffer[] = [];
    
    try {
      // Procesar cada chunk individualmente
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Processing chunk ${i + 1}/${chunks.length}, size: ${chunk.length} characters`);
        
        // Notificar progreso al frontend
        if (onProgress) {
          onProgress({
            processedChunks: i,
            totalChunks,
            processedCharacters: chunks.slice(0, i).reduce((acc, chunk) => acc + chunk.length, 0),
            totalCharacters: text.length,
            currentChunk: chunk
          });
        }

        // Llamar a la edge function con cada chunk individual
        const { data, error } = await supabase.functions.invoke('convert-to-audio', {
          body: {
            text: chunk,
            voiceId,
            fileName,
            conversionId,
            chunkIndex: i,
            totalChunks: chunks.length
          },
        });

        if (error) {
          console.error(`Error in chunk ${i + 1}:`, error);
          throw error;
        }

        if (!data?.audioContent) {
          throw new Error(`No audio content received for chunk ${i + 1}`);
        }

        // Convertir base64 a ArrayBuffer
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        audioBuffers.push(bytes.buffer);
      }

      // Combinar todos los chunks de audio
      const finalAudioBuffer = new Uint8Array(
        audioBuffers.reduce((acc, buffer) => acc + buffer.byteLength, 0)
      );

      let offset = 0;
      audioBuffers.forEach(buffer => {
        finalAudioBuffer.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
      });

      // Notificar progreso final
      if (onProgress) {
        onProgress({
          processedChunks: totalChunks,
          totalChunks,
          processedCharacters: text.length,
          totalCharacters: text.length,
          currentChunk: null
        });
      }

      console.log('Conversion completed successfully');
      
      return { 
        audio: finalAudioBuffer.buffer,
        id: conversionId
      };

    } catch (error) {
      console.error('Error during conversion:', error);
      throw error;
    }

  } catch (error) {
    console.error('Fatal error in convertToAudio:', error);
    throw error;
  }
}
