
import { supabase } from "@/integrations/supabase/client";
import { generateHash, splitTextIntoChunks, retryOperation } from "./utils";
import { TextChunkCallback, ChunkProgressData } from "./types/chunks";

const CHUNK_SIZE = 4800;
const MAX_CONCURRENT_REQUESTS = 3;
const MAX_RETRIES_PER_CHUNK = 5; // Aumentado el número de reintentos

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
    
    // Mapa para verificar la integridad de los chunks procesados
    const processedChunksMap = new Map<number, ArrayBuffer>();
    
    // Función mejorada para procesar cada chunk con múltiples reintentos
    const processChunk = async (chunk: string, index: number): Promise<ArrayBuffer> => {
      console.log(`Processing chunk ${index + 1}/${totalChunks}, size: ${chunk.length} characters`);
      
      if (!chunk.trim()) {
        console.warn(`Empty chunk detected at index ${index}, using placeholder audio`);
        // En lugar de saltar, generamos un silencio breve para mantener continuidad
        const silencePlaceholder = new Uint8Array([
          0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        return silencePlaceholder.buffer;
      }

      const requestBody = {
        text: chunk,
        voiceId: voiceId,
        chunkIndex: index,
        totalChunks: totalChunks
      };
      
      // Incrementamos el número de reintentos y añadimos backoff exponencial
      const response = await retryOperation(
        () => supabase.functions.invoke('convert-to-audio', { body: requestBody }),
        { 
          maxRetries: MAX_RETRIES_PER_CHUNK, 
          baseDelay: 1000,  
          operation: `Convert chunk ${index + 1}`
        }
      );

      if (response.error) {
        console.error(`Edge function error for chunk ${index + 1} after multiple retries:`, response.error);
        throw new Error(`Error crítico en chunk ${index + 1}: ${response.error.message}`);
      }

      if (!response.data) {
        console.error(`Empty response for chunk ${index + 1} after multiple retries:`, response);
        throw new Error(`No se recibieron datos del edge function para el chunk ${index + 1}`);
      }

      const { data } = response;

      if (!data.audioContent) {
        console.error(`Missing audioContent for chunk ${index + 1} after multiple retries:`, data);
        throw new Error(`Contenido de audio ausente para el chunk ${index + 1}`);
      }

      try {
        console.log(`Processing audio data for chunk ${index + 1}, length: ${data.audioContent.length}`);
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        
        // Verificación para asegurar que el buffer no esté vacío
        if (bytes.length === 0) {
          throw new Error(`El buffer de audio del chunk ${index + 1} está vacío`);
        }
        
        return bytes.buffer;
      } catch (error: any) {
        console.error(`Base64 conversion error for chunk ${index + 1}:`, error);
        throw new Error(`Error al procesar los datos de audio para el chunk ${index + 1}: ${error.message}`);
      }
    };

    // Sistema mejorado de procesamiento paralelo con garantía de integridad
    const processChunksWithConcurrencyLimit = async (): Promise<void> => {
      let currentIndex = 0;
      let localProcessedCharacters = 0;
      let failedChunks: number[] = [];
      
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
            processedChunksMap.set(nextIndex, buffer);
            
            // Actualizar el contador de caracteres procesados
            localProcessedCharacters += chunks[nextIndex].length;
            processedCharacters = localProcessedCharacters; // Actualizar variable global
            
            // Notificar progreso
            if (onProgress) {
              const progressData: ChunkProgressData = {
                processedChunks: processedChunksMap.size,
                totalChunks,
                processedCharacters: localProcessedCharacters,
                totalCharacters,
                currentChunk: chunks[nextIndex]
              };
              onProgress(progressData);
            }
            
            console.log(`Worker completed chunk ${nextIndex + 1}/${chunks.length} successfully`);
          } catch (error) {
            console.error(`Error processing chunk ${nextIndex}:`, error);
            failedChunks.push(nextIndex);
            
            if (onProgress) {
              const progressData: ChunkProgressData = {
                processedChunks: processedChunksMap.size,
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

      // Ejecutar trabajadores en paralelo con límite de concurrencia
      const workers = Array(Math.min(MAX_CONCURRENT_REQUESTS, chunks.length))
        .fill(null)
        .map(() => worker());
      
      await Promise.all(workers);
      
      console.log(`First pass completed. Processed ${processedChunksMap.size}/${totalChunks} chunks successfully. Failed: ${failedChunks.length}`);
      
      // Segunda pasada para reintentar chunks fallidos con máxima prioridad
      if (failedChunks.length > 0) {
        console.log(`Starting second pass to retry ${failedChunks.length} failed chunks`);
        
        for (const failedIndex of failedChunks) {
          try {
            console.log(`Retrying failed chunk ${failedIndex + 1}/${totalChunks} with higher priority`);
            
            // Intento especial con más reintentos y tiempos de espera más largos
            const buffer = await retryOperation(
              () => processChunk(chunks[failedIndex], failedIndex),
              { 
                maxRetries: MAX_RETRIES_PER_CHUNK * 2, // Duplicamos los reintentos 
                baseDelay: 2000, // Mayor tiempo entre reintentos
                operation: `Retry failed chunk ${failedIndex + 1}`
              }
            );
            
            processedChunksMap.set(failedIndex, buffer);
            
            localProcessedCharacters += chunks[failedIndex].length;
            processedCharacters = localProcessedCharacters;
            
            console.log(`Successfully recovered chunk ${failedIndex + 1} in second pass`);
            
            if (onProgress) {
              const progressData: ChunkProgressData = {
                processedChunks: processedChunksMap.size,
                totalChunks,
                processedCharacters,
                totalCharacters,
                currentChunk: chunks[failedIndex]
              };
              onProgress(progressData);
            }
          } catch (error) {
            console.error(`CRITICAL: Failed to process chunk ${failedIndex + 1} even after extensive retries:`, error);
            
            // Como último recurso, crear un placeholder para mantener continuidad
            const silencePlaceholder = new Uint8Array([
              0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
              0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
            ]);
            
            processedChunksMap.set(failedIndex, silencePlaceholder.buffer);
            
            if (onProgress) {
              const progressData: ChunkProgressData = {
                processedChunks: processedChunksMap.size,
                totalChunks,
                processedCharacters,
                totalCharacters,
                currentChunk: chunks[failedIndex],
                warning: `El chunk ${failedIndex + 1} falló después de múltiples intentos y se ha reemplazado con silencio.`
              };
              onProgress(progressData);
            }
          }
        }
      }
    };

    console.log(`Starting robust parallel processing with max ${MAX_CONCURRENT_REQUESTS} concurrent requests`);
    await processChunksWithConcurrencyLimit();
    
    // Verificación de integridad
    const missingChunks = [];
    for (let i = 0; i < totalChunks; i++) {
      if (!processedChunksMap.has(i)) {
        missingChunks.push(i + 1); // 1-indexed para los mensajes
      }
    }
    
    if (missingChunks.length > 0) {
      console.error(`CRITICAL INTEGRITY ERROR: Missing chunks after all processing attempts: ${missingChunks.join(', ')}`);
      
      // Último intento para chunks faltantes
      for (const missingIndex of missingChunks.map(i => i - 1)) { // Convert back to 0-indexed
        console.log(`Last attempt for critically missing chunk ${missingIndex + 1}`);
        try {
          const buffer = await processChunk(chunks[missingIndex], missingIndex);
          processedChunksMap.set(missingIndex, buffer);
        } catch (error) {
          console.error(`Ultimate failure for chunk ${missingIndex + 1}, using silence placeholder`);
          // Usamos un placeholder de silencio como último recurso
          const silencePlaceholder = new Uint8Array([
            0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
          ]);
          processedChunksMap.set(missingIndex, silencePlaceholder.buffer);
        }
      }
    }
    
    // Extraer los buffers en orden correcto
    const orderedBuffers: ArrayBuffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const buffer = processedChunksMap.get(i);
      if (buffer) {
        orderedBuffers.push(buffer);
      } else {
        // Esto no debería ocurrir nunca con la lógica mejorada
        throw new Error(`Error crítico de integridad: No se pudo encontrar el chunk ${i + 1} después de todos los intentos`);
      }
    }
    
    console.log(`Final integrity check passed. Proceeding with ${orderedBuffers.length}/${totalChunks} chunks to create audio file.`);
    
    // Calcular el tamaño total para el archivo final
    const totalLength = orderedBuffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
    console.log(`Creating final audio with total size: ${totalLength} bytes`);
    
    // Crear buffer final
    const finalAudioBuffer = new Uint8Array(totalLength);
    
    // Combinar todos los chunks en el buffer final
    let offset = 0;
    orderedBuffers.forEach((buffer, index) => {
      const chunkData = new Uint8Array(buffer);
      console.log(`Adding chunk ${index + 1} to final audio, size: ${chunkData.byteLength} bytes`);
      finalAudioBuffer.set(chunkData, offset);
      offset += chunkData.byteLength;
    });
    
    // Verificación final de integridad
    if (finalAudioBuffer.byteLength === 0) {
      console.error('CRITICAL: Final audio buffer is empty after all processing');
      throw new Error('Error crítico: El archivo de audio final está vacío después de todos los intentos');
    }
    
    if (orderedBuffers.length !== totalChunks) {
      const warning = `Advertencia de integridad: El audio final contiene ${orderedBuffers.length} chunks de los ${totalChunks} originales.`;
      console.warn(warning);
      if (onProgress) {
        const progressData: ChunkProgressData = {
          processedChunks: orderedBuffers.length,
          totalChunks,
          processedCharacters,
          totalCharacters,
          currentChunk: "",
          warning
        };
        onProgress(progressData);
      }
    }

    console.log(`Audio conversion completed successfully with final size: ${finalAudioBuffer.buffer.byteLength} bytes`);
    
    const conversionId = crypto.randomUUID();
    
    // Notificar completitud
    if (onProgress) {
      onProgress({
        processedChunks: totalChunks,
        totalChunks,
        processedCharacters,
        totalCharacters,
        currentChunk: "",
        progress: 100,
        isCompleted: true
      });
    }
    
    return {
      audio: finalAudioBuffer.buffer,
      id: conversionId
    };
  } catch (error: any) {
    console.error('Fatal error in convertToAudio:', error);
    throw error;
  }
}
