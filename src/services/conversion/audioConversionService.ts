
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
    // Validar parámetros antes de procesar
    if (!voiceId || typeof voiceId !== 'string') {
      throw new Error('El parámetro voiceId debe ser una cadena no vacía');
    }
    
    if (!text || typeof text !== 'string') {
      throw new Error('El parámetro text debe ser una cadena no vacía');
    }

    // Dividir el texto en chunks
    const chunks = splitTextIntoChunks(text, CHUNK_SIZE);
    console.log(`Text split into ${chunks.length} chunks`);
    
    const totalChunks = chunks.length;
    const audioBuffers: ArrayBuffer[] = [];
    
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

      console.log(`Preparing request for chunk ${i + 1} with voiceId: ${voiceId}`);

      // Preparar cuerpo de la solicitud - usando 'voiceId' como nombre del parámetro
      const requestBody = {
        text: chunk,
        voiceId: voiceId // IMPORTANTE: Este es el nombre esperado por la función edge
      };
      
      console.log(`Request for chunk ${i + 1}:`, JSON.stringify(requestBody));
      
      // Intentar la conversión con retry
      const response = await retryOperation(
        () => supabase.functions.invoke('convert-to-audio', { body: requestBody }),
        { maxRetries: 3, initialDelay: 1000 }
      );

      console.log(`Response for chunk ${i + 1}:`, JSON.stringify(response));

      if (response.error) {
        console.error(`Edge function error for chunk ${i + 1}:`, {
          error: response.error,
          message: response.error.message,
          name: response.error.name,
          data: response.data
        });
        throw new Error(`Error converting chunk ${i + 1}: ${response.error.message}`);
      }

      if (!response.data) {
        console.error(`Empty response for chunk ${i + 1}:`, response);
        throw new Error(`No data received from edge function for chunk ${i + 1}`);
      }

      const { data } = response;
      console.log(`Data keys for chunk ${i + 1}:`, Object.keys(data));

      if (!data.audioContent) {
        console.error(`Missing audioContent for chunk ${i + 1}:`, data);
        throw new Error(`No audio content in response for chunk ${i + 1}. Response keys: ${Object.keys(data).join(', ')}`);
      }

      // Convertir base64 a ArrayBuffer
      try {
        console.log(`Processing audio data for chunk ${i + 1}, length: ${data.audioContent.length}`);
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        audioBuffers.push(bytes.buffer);
        console.log(`Successfully processed audio data for chunk ${i + 1}, size: ${bytes.buffer.byteLength} bytes`);
      } catch (error: any) {
        console.error(`Base64 conversion error for chunk ${i + 1}:`, error);
        throw new Error(`Error processing audio data for chunk ${i + 1}: ${error.message}`);
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
    console.error('Fatal error in convertToAudio:', error);
    throw error;
  }
}
