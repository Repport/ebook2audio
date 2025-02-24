
import { supabase } from "@/integrations/supabase/client";
import { generateHash, splitTextIntoChunks } from "./utils";
import { TextChunkCallback } from "./types/chunks";

const CHUNK_SIZE = 4800;

export async function convertToAudio(
  text: string,
  voiceId: string,
  onProgress?: TextChunkCallback
): Promise<ArrayBuffer> {
  console.log('Starting conversion process with:', {
    textLength: text?.length,
    voiceId
  });

  try {
    // Dividir el texto en chunks
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
            processedChunks: i + 1,
            totalChunks,
            processedCharacters: chunks.slice(0, i + 1).reduce((acc, chunk) => acc + chunk.length, 0),
            totalCharacters: text.length,
            currentChunk: chunk
          });
        }

        // Llamar a la edge function con cada chunk individual
        const { data, error } = await supabase.functions.invoke('convert-to-audio', {
          body: {
            text: chunk,
            voiceId
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

      console.log('Conversion completed successfully');
      
      return finalAudioBuffer.buffer;

    } catch (error) {
      console.error('Error during conversion:', error);
      throw error;
    }

  } catch (error) {
    console.error('Fatal error in convertToAudio:', error);
    throw error;
  }
}
