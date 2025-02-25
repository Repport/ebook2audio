
import { supabase } from "@/integrations/supabase/client";
import { generateHash, splitTextIntoChunks, retryOperation } from "./utils";
import { TextChunkCallback, ChunkProgressData } from "./types/chunks";

const CHUNK_SIZE = 4800;
const MAX_CONCURRENT_REQUESTS = 3; // Limitamos a 3 peticiones concurrentes para evitar sobrecarga

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
    const totalCharacters = text.length;
    let processedCharacters = 0;
    
    // Función para procesar un chunk individual
    const processChunk = async (chunk: string, index: number): Promise<ArrayBuffer> => {
      console.log(`Processing chunk ${index + 1}/${totalChunks}, size: ${chunk.length} characters`);
      
      // Verificar que el chunk no esté vacío
      if (!chunk.trim()) {
        console.warn(`Empty chunk detected at index ${index}, skipping...`);
        return new ArrayBuffer(0);
      }

      console.log(`Preparing request for chunk ${index + 1} with voiceId: ${voiceId}`);

      // Preparar cuerpo de la solicitud
      const requestBody = {
        text: chunk,
        voiceId: voiceId,
        chunkIndex: index,
        totalChunks: totalChunks
      };
      
      // Intentar la conversión con retry
      const response = await retryOperation(
        () => supabase.functions.invoke('convert-to-audio', { body: requestBody }),
        { 
          maxRetries: 3, 
          baseDelay: 1000,  
          operation: `Convert chunk ${index + 1}`
        }
      );

      if (response.error) {
        console.error(`Edge function error for chunk ${index + 1}:`, {
          error: response.error,
          message: response.error.message,
          name: response.error.name,
          data: response.data
        });
        throw new Error(`Error converting chunk ${index + 1}: ${response.error.message}`);
      }

      if (!response.data) {
        console.error(`Empty response for chunk ${index + 1}:`, response);
        throw new Error(`No data received from edge function for chunk ${index + 1}`);
      }

      const { data } = response;

      if (!data.audioContent) {
        console.error(`Missing audioContent for chunk ${index + 1}:`, data);
        // En lugar de lanzar un error, devolvemos un buffer vacío para que la conversión pueda continuar
        // con los demás chunks, y registramos el error
        if (onProgress) {
          const progressData: ChunkProgressData = {
            processedChunks: index + 1,
            totalChunks,
            processedCharacters: processedCharacters + chunk.length,
            totalCharacters,
            currentChunk: chunk,
            error: `No audio content for chunk ${index + 1}`
          };
          onProgress(progressData);
        }
        return new ArrayBuffer(0);
      }

      // Convertir base64 a ArrayBuffer
      try {
        console.log(`Processing audio data for chunk ${index + 1}, length: ${data.audioContent.length}`);
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        processedCharacters += chunk.length;
        
        // Actualizar progreso
        if (onProgress) {
          const progressData: ChunkProgressData = {
            processedChunks: index + 1,
            totalChunks,
            processedCharacters,
            totalCharacters,
            currentChunk: chunk
          };
          onProgress(progressData);
        }

        return bytes.buffer;
      } catch (error: any) {
        console.error(`Base64 conversion error for chunk ${index + 1}:`, error);
        // Registramos el error pero no interrumpimos el proceso
        if (onProgress) {
          const progressData: ChunkProgressData = {
            processedChunks: index + 1,
            totalChunks,
            processedCharacters: processedCharacters + chunk.length,
            totalCharacters,
            currentChunk: chunk,
            error: `Error processing audio data for chunk ${index + 1}: ${error.message}`
          };
          onProgress(progressData);
        }
        return new ArrayBuffer(0);
      }
    };

    // Procesar chunks en paralelo con límite de concurrencia
    const processChunksWithConcurrencyLimit = async (): Promise<{buffers: ArrayBuffer[], errors: number}> => {
      const results: ArrayBuffer[] = new Array(chunks.length);
      let errorCount = 0;
      let currentIndex = 0;
      
      // Función para obtener el siguiente índice a procesar
      const getNextChunkIndex = (): number | null => {
        if (currentIndex >= chunks.length) {
          return null;
        }
        return currentIndex++;
      };

      // Crear un trabajador que procese chunks hasta que no queden más
      const worker = async (): Promise<void> => {
        let nextIndex: number | null;
        
        while ((nextIndex = getNextChunkIndex()) !== null) {
          try {
            console.log(`Worker starting chunk ${nextIndex + 1}/${chunks.length}`);
            const buffer = await processChunk(chunks[nextIndex], nextIndex);
            results[nextIndex] = buffer;
            console.log(`Worker completed chunk ${nextIndex + 1}/${chunks.length}`);
          } catch (error) {
            console.error(`Error processing chunk ${nextIndex}:`, error);
            results[nextIndex] = new ArrayBuffer(0);
            errorCount++;
            
            // Notificar del error pero continuar con la conversión
            if (onProgress) {
              const progressData: ChunkProgressData = {
                processedChunks: nextIndex + 1,
                totalChunks,
                processedCharacters,
                totalCharacters,
                currentChunk: chunks[nextIndex],
                error: error instanceof Error ? error.message : String(error)
              };
              onProgress(progressData);
            }
          }
        }
      };

      // Crear un array de trabajadores según el límite de concurrencia
      const workers = Array(Math.min(MAX_CONCURRENT_REQUESTS, chunks.length))
        .fill(null)
        .map(() => worker());
      
      // Esperar a que todos los trabajadores terminen
      await Promise.all(workers);
      
      console.log(`All workers completed. Processed ${currentIndex} chunks with ${errorCount} errors.`);
      return { buffers: results, errors: errorCount };
    };

    // Procesar todos los chunks en paralelo con límite de concurrencia
    console.log(`Starting parallel processing with max ${MAX_CONCURRENT_REQUESTS} concurrent requests`);
    const { buffers: audioBuffers, errors: errorCount } = await processChunksWithConcurrencyLimit();
    
    // Verificar si hubo demasiados errores para continuar
    if (errorCount === totalChunks) {
      throw new Error('Todos los chunks fallaron durante la conversión');
    }
    
    // Mostrar advertencia si hay algunos chunks fallidos
    if (errorCount > 0) {
      console.warn(`⚠️ ${errorCount} de ${totalChunks} chunks fallaron durante la conversión`);
      // Notificar al usuario mediante el callback de progreso
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
    
    // Combinar todos los chunks de audio (ignorando los vacíos)
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
