
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
    const processedChunksMap = new Map<number, boolean>();
    for (let i = 0; i < totalChunks; i++) {
      processedChunksMap.set(i, false);
    }
    
    const processChunk = async (chunk: string, index: number): Promise<ArrayBuffer> => {
      console.log(`Processing chunk ${index + 1}/${totalChunks}, size: ${chunk.length} characters`);
      
      if (!chunk.trim()) {
        console.warn(`Empty chunk detected at index ${index}, skipping...`);
        processedChunksMap.set(index, true); // Marcar como procesado aunque esté vacío
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

        // Marcar el chunk como procesado correctamente
        processedChunksMap.set(index, true);
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
    
    // Verificar integridad - asegurarnos de que todos los chunks fueron procesados
    const unprocessedChunks = [...processedChunksMap.entries()]
      .filter(([_, processed]) => !processed)
      .map(([index]) => index + 1);
    
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
    
    if (errorCount > 0) {
      console.warn(`⚠️ ${errorCount} de ${totalChunks} chunks fallaron durante la conversión`);
      if (onProgress) {
        const progressData: ChunkProgressData = {
          processedChunks: totalChunks,
          totalChunks,
          processedCharacters,
          totalCharacters,
          currentChunk: "",
          warning: `${errorCount} chunks no pudieron ser convertidos. El audio puede estar incompleto.`
        };
        onProgress(progressData);
      }
    }
    
    const nonEmptyBuffers = audioBuffers.filter(buffer => buffer?.byteLength > 0);
    const totalLength = nonEmptyBuffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
    console.log(`Combining ${nonEmptyBuffers.length} audio chunks with total size: ${totalLength} bytes`);
    
    const finalAudioBuffer = new Uint8Array(totalLength);

    let offset = 0;
    nonEmptyBuffers.forEach(buffer => {
      finalAudioBuffer.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    });

    console.log('Audio conversion completed successfully');
    
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
