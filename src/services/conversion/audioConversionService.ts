
import { supabase } from "@/integrations/supabase/client";
import { generateHash, splitTextIntoChunks, retryOperation } from "./utils";
import { TextChunkCallback } from "./types/chunks";

const CHUNK_SIZE = 4800;

export async function convertToAudio(
  text: string,
  voiceId: string,
  onProgress?: TextChunkCallback
): Promise<{ audio: ArrayBuffer; id: string }> {
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

        // Verificar que el chunk no esté vacío
        if (!chunk.trim()) {
          console.warn(`Empty chunk detected at index ${i}, skipping...`);
          continue;
        }

        // Llamar a la edge function con cada chunk individual con retry
        console.log('Sending chunk to edge function:', {
          chunkSize: chunk.length,
          voice: voiceId,
          chunkPreview: chunk.substring(0, 50) + '...'
        });

        // Intenta con diferentes formatos de parámetros para identificar el correcto
        try {
          // Intentamos con la forma más probable primero
          const requestBody = {
            text: chunk,
            voice: voiceId
          };
          
          console.log('Request body:', JSON.stringify(requestBody));
          
          const response = await supabase.functions.invoke('convert-to-audio', {
            body: requestBody
          });

          console.log('Raw response from edge function:', JSON.stringify(response));

          if (response.error) {
            console.error('Edge function error details:', {
              error: response.error,
              message: response.error.message,
              name: response.error.name,
              data: response.data
            });
            throw new Error(`Error converting chunk ${i + 1}: ${response.error.message}`);
          }

          if (!response.data) {
            console.error('Empty response from edge function:', response);
            throw new Error(`No data received from edge function for chunk ${i + 1}`);
          }

          console.log('Edge function response data keys:', Object.keys(response.data));

          const { data } = response;

          if (!data.audioContent) {
            console.error('Missing audioContent in response:', data);
            throw new Error(`No audio content in response for chunk ${i + 1}. Response keys: ${Object.keys(data).join(', ')}`);
          }

          // Convertir base64 a ArrayBuffer
          try {
            const binaryString = atob(data.audioContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              bytes[j] = binaryString.charCodeAt(j);
            }

            audioBuffers.push(bytes.buffer);
            console.log(`Successfully processed chunk ${i + 1}`);
          } catch (error: any) {
            console.error('Base64 conversion error:', error);
            throw new Error(`Error processing audio data for chunk ${i + 1}: ${error.message}`);
          }
        } catch (error: any) {
          console.error(`Failed attempt for chunk ${i + 1}:`, error);
          throw error;
        }
      }

      // Combinar todos los chunks de audio
      const totalLength = audioBuffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
      console.log(`Combining ${audioBuffers.length} audio chunks with total size: ${totalLength} bytes`);
      
      const finalAudioBuffer = new Uint8Array(totalLength);

      let offset = 0;
      audioBuffers.forEach(buffer => {
        finalAudioBuffer.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
      });

      console.log('Audio conversion completed successfully');
      
      // Generar un ID único para esta conversión
      const conversionId = crypto.randomUUID();
      
      return {
        audio: finalAudioBuffer.buffer,
        id: conversionId
      };

    } catch (error: any) {
      console.error('Error during conversion:', error);
      throw error;
    }

  } catch (error: any) {
    console.error('Fatal error in convertToAudio:', error);
    throw error;
  }
}
