
import { supabase } from "@/integrations/supabase/client";
import { generateHash, splitTextIntoChunks, retryOperation } from "./utils";
import { TextChunkCallback, ChunkProgressData } from "./types/chunks";

const CHUNK_SIZE = 4800;
const MAX_CONCURRENT_REQUESTS = 3;

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
    if (!voiceId || typeof voiceId !== 'string') {
      throw new Error('El parámetro voiceId debe ser una cadena no vacía');
    }
    
    if (!text || typeof text !== 'string') {
      throw new Error('El parámetro text debe ser una cadena no vacía');
    }

    const chunks = splitTextIntoChunks(text, CHUNK_SIZE);
    console.log(`Text split into ${chunks.length} chunks`);
    
    const totalChunks = chunks.length;
    const totalCharacters = text.length;
    let processedCharacters = 0;
    
    // Crear un mapa para verificar que todos los chunks fueron procesados
    const processedChunksMap = new Map<number, ArrayBuffer>();
    
    const processChunk = async (chunk: string, index: number): Promise<ArrayBuffer> => {
      console.log(`Processing chunk ${index + 1}/${totalChunks}, size: ${chunk.length} characters`);
      
      if (!chunk.trim()) {
        console.warn(`Empty chunk detected at index ${index}, skipping...`);
        return new ArrayBuffer(0);
      }

      const requestBody = {
        text: chunk,
        voiceId: voiceId,
        chunkIndex: index,
        totalChunks: totalChunks
      };
      
      const response = await retryOperation(
        () => supabase.functions.invoke('convert-to-audio', { body: requestBody }),
        { 
          maxRetries: 3, 
          baseDelay: 1000,  
          operation: `Convert chunk ${index + 1}`
        }
      );

      if (response.error) {
        console.error(`Edge function error for chunk ${index + 1}:`, response.error);
        throw new Error(`Error converting chunk ${index + 1}: ${response.error.message}`);
      }

      if (!response.data) {
        console.error(`Empty response for chunk ${index + 1}:`, response);
        throw new Error(`No data received from edge function for chunk ${index + 1}`);
      }

      const { data } = response;

      if (!data.audioContent) {
        console.error(`Missing audioContent for chunk ${index + 1}:`, data);
        if (onProgress) {
          const progressData: ChunkProgressData = {
            processedChunks: index + 1,
            totalChunks,
            processedCharacters,
            totalCharacters,
            currentChunk: chunk,
            error: `No audio content for chunk ${index + 1}`
          };
          onProgress(progressData);
        }
        return new ArrayBuffer(0);
      }

      try {
        console.log(`Processing audio data for chunk ${index + 1}, length: ${data.audioContent.length}`);
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        return bytes.buffer;
      } catch (error: any) {
        console.error(`Base64 conversion error for chunk ${index + 1}:`, error);
        if (onProgress) {
          const progressData: ChunkProgressData = {
            processedChunks: index + 1,
            totalChunks,
            processedCharacters,
            totalCharacters,
            currentChunk: chunk,
            error: `Error processing audio data for chunk ${index + 1}: ${error.message}`
          };
          onProgress(progressData);
        }
        return new ArrayBuffer(0);
      }
    };

    const processChunksWithConcurrencyLimit = async (): Promise<{buffers: ArrayBuffer[], errors: number}> => {
      const results: ArrayBuffer[] = new Array(chunks.length);
      let errorCount = 0;
      let currentIndex = 0;
      let localProcessedCharacters = 0;
      
      const getNextChunkIndex = (): number | null => {
        if (currentIndex >= chunks.length) {
          return null;
        }
        return currentIndex++;
      };

      const worker = async (): Promise<void> => {
        let nextIndex: number | null;
        
        while ((nextIndex = getNextChunkIndex()) !== null) {
          try {
            console.log(`Worker starting chunk ${nextIndex + 1}/${chunks.length}`);
            const buffer = await processChunk(chunks[nextIndex], nextIndex);
            
            // Almacenar el buffer en el mapa con el índice como clave
            if (buffer.byteLength > 0) {
              processedChunksMap.set(nextIndex, buffer);
            }
            
            results[nextIndex] = buffer;
            
            // Actualizar el contador de caracteres procesados
            localProcessedCharacters += chunks[nextIndex].length;
            processedCharacters = localProcessedCharacters; // Actualizar variable global
            
            // Notificar progreso
            if (onProgress) {
              const progressData: ChunkProgressData = {
                processedChunks: nextIndex + 1,
                totalChunks,
                processedCharacters: localProcessedCharacters,
                totalCharacters,
                currentChunk: chunks[nextIndex]
              };
              onProgress(progressData);
            }
            
            console.log(`Worker completed chunk ${nextIndex + 1}/${chunks.length}`);
          } catch (error) {
            console.error(`Error processing chunk ${nextIndex}:`, error);
            results[nextIndex] = new ArrayBuffer(0);
            errorCount++;
            
            if (onProgress) {
              const progressData: ChunkProgressData = {
                processedChunks: nextIndex + 1,
                totalChunks,
                processedCharacters: localProcessedCharacters,
                totalCharacters,
                currentChunk: chunks[nextIndex],
                error: error instanceof Error ? error.message : String(error)
              };
              onProgress(progressData);
            }
          }
        }
      };

      const workers = Array(Math.min(MAX_CONCURRENT_REQUESTS, chunks.length))
        .fill(null)
        .map(() => worker());
      
      await Promise.all(workers);
      
      console.log(`All workers completed. Processed ${currentIndex} chunks with ${errorCount} errors.`);
      return { buffers: results, errors: errorCount };
    };

    console.log(`Starting parallel processing with max ${MAX_CONCURRENT_REQUESTS} concurrent requests`);
    const { buffers: audioBuffers, errors: errorCount } = await processChunksWithConcurrencyLimit();
    
    if (errorCount === totalChunks) {
      throw new Error('Todos los chunks fallaron durante la conversión');
    }
    
    // Extraer los buffers del mapa de procesamiento, asegurando orden correcto
    const orderedBuffers: ArrayBuffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const buffer = processedChunksMap.get(i);
      if (buffer && buffer.byteLength > 0) {
        orderedBuffers.push(buffer);
      }
    }
    
    console.log(`Extracted ${orderedBuffers.length} valid buffers from processed chunks map`);
    
    // Verificar integridad y crear una lista de chunks no procesados para logs
    const unprocessedChunks: number[] = [];
    for (let i = 0; i < totalChunks; i++) {
      if (!processedChunksMap.has(i) || processedChunksMap.get(i)?.byteLength === 0) {
        unprocessedChunks.push(i + 1);  // Añadir 1 para que sea 1-indexed en los mensajes
      }
    }
    
    if (unprocessedChunks.length > 0) {
      const warningMessage = `Advertencia: Los siguientes chunks no fueron procesados correctamente: ${unprocessedChunks.join(', ')}`;
      console.warn(warningMessage);
      if (onProgress) {
        const progressData: ChunkProgressData = {
          processedChunks: totalChunks - unprocessedChunks.length,
          totalChunks,
          processedCharacters,
          totalCharacters,
          currentChunk: "",
          warning: warningMessage
        };
        onProgress(progressData);
      }
    }
    
    // Verificar si el total de caracteres procesados coincide con el total esperado
    const expectedCharactersTotal = chunks.reduce((total, chunk) => total + chunk.length, 0);
    if (processedCharacters !== expectedCharactersTotal) {
      const integrityWarning = `Advertencia de integridad: Se procesaron ${processedCharacters} caracteres de ${expectedCharactersTotal} esperados`;
      console.warn(integrityWarning);
      if (onProgress) {
        const progressData: ChunkProgressData = {
          processedChunks: totalChunks,
          totalChunks,
          processedCharacters,
          totalCharacters,
          currentChunk: "",
          warning: integrityWarning
        };
        onProgress(progressData);
      }
    }
    
    // Crear un bloque artificial de audio si no hay datos para evitar error
    if (orderedBuffers.length === 0) {
      console.warn("No valid audio chunks found. Creating placeholder audio.");
      
      // Crear un archivo MP3 vacío mínimo para evitar errores
      // Este es un encabezado MP3 básico que representa silencio
      const placeholderMP3Header = new Uint8Array([
        0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);
      
      orderedBuffers.push(placeholderMP3Header.buffer);
      
      // Notificar esta situación
      if (onProgress) {
        const progressData: ChunkProgressData = {
          processedChunks: totalChunks,
          totalChunks,
          processedCharacters,
          totalCharacters,
          currentChunk: "",
          warning: "No se pudo generar audio válido. Se ha creado un archivo vacío."
        };
        onProgress(progressData);
      }
    }
    
    // Calcular el tamaño total con los buffers válidos ordenados
    const totalLength = orderedBuffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
    console.log(`Combining ${orderedBuffers.length} audio chunks with total size: ${totalLength} bytes`);
    
    // Crear el buffer final
    const finalAudioBuffer = new Uint8Array(totalLength);
    
    let offset = 0;
    orderedBuffers.forEach(buffer => {
      finalAudioBuffer.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    });
    
    if (totalLength === 0) {
      console.error('Critical error: Final audio buffer is empty');
      throw new Error('El archivo de audio final está vacío');
    }

    console.log(`Audio conversion completed successfully with final size: ${finalAudioBuffer.buffer.byteLength} bytes`);
    
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
