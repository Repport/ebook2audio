
import { ChunkManager } from './chunkManager';
import { ProcessChunkResult } from './types/chunkTypes';
import { processChunk } from './chunkProcessor';
import { LoggingService } from '@/utils/loggingService';

// Configuración del procesamiento paralelo
const MAX_PARALLEL_CHUNKS = 3;
const MAX_CHUNK_RETRIES = 3;

/**
 * Procesa los chunks en paralelo usando un sistema de colas de prioridad
 */
export async function processChunksInParallel(
  chunkManager: ChunkManager,
  voiceId: string
): Promise<void> {
  const totalChunks = chunkManager.getTotalChunks();
  const conversionId = chunkManager.getConversionId();
  
  console.log(`Starting parallel processing of ${totalChunks} chunks${conversionId ? ` for conversion ${conversionId}` : ''}`);
  
  // Control de chunks activos y finalización
  let activeWorkers = 0;
  let chunkIndex = 0;
  let isCompleted = false;
  let hasError = false;
  
  // Creamos una lista para los chunks que fallan y necesitan reintento
  const retryQueue: number[] = [];
  
  // Implementación del worker que procesa chunks
  const processNextChunk = async (workerId: number): Promise<void> => {
    if (isCompleted || hasError) return;
    
    // Primero intentamos procesar los chunks de la cola de reintentos
    let nextChunkIndex: number | undefined;
    if (retryQueue.length > 0) {
      nextChunkIndex = retryQueue.shift();
      console.log(`Worker ${workerId} retrying chunk ${nextChunkIndex + 1}/${totalChunks}`);
    } 
    // Si no hay reintentos pendientes, tomamos el siguiente chunk secuencial
    else if (chunkIndex < totalChunks) {
      nextChunkIndex = chunkIndex++;
      console.log(`Worker ${workerId} processing chunk ${nextChunkIndex + 1}/${totalChunks}`);
    } 
    // Si no hay más chunks, terminamos
    else {
      console.log(`Worker ${workerId} has no more chunks to process`);
      return;
    }
    
    if (nextChunkIndex === undefined) return;
    
    try {
      // Obtenemos el contenido del chunk
      const chunkText = chunkManager.getChunkContent(nextChunkIndex);
      
      // Procesamos el chunk y obtenemos el buffer de audio
      const buffer = await processChunk(chunkText, nextChunkIndex, voiceId, totalChunks, conversionId);
      
      // Registramos el resultado
      chunkManager.registerChunkResult({
        buffer,
        index: nextChunkIndex
      });
      
      // Procesamos el próximo chunk
      await processNextChunk(workerId);
    } catch (error: any) {
      console.error(`Error processing chunk ${nextChunkIndex + 1}/${totalChunks}:`, error);
      
      // Verificar si debemos reintentar
      const retryCount = chunkManager.getRetryCount(nextChunkIndex);
      if (retryCount < MAX_CHUNK_RETRIES) {
        // Incrementar contador de reintentos
        chunkManager.incrementRetryCount(nextChunkIndex);
        
        // Añadir a la cola de reintentos
        console.log(`Adding chunk ${nextChunkIndex + 1} to retry queue (attempt ${retryCount + 1})`);
        retryQueue.push(nextChunkIndex);
        
        // Log a sistema
        LoggingService.warn('conversion', {
          message: `Reintentando chunk ${nextChunkIndex + 1}/${totalChunks} (intento ${retryCount + 1})`,
          error: error.message,
          chunk_index: nextChunkIndex,
          total_chunks: totalChunks
        });
      } else {
        // Si excedimos el número de reintentos, registramos un error fatal
        LoggingService.error('conversion', {
          message: `Fallo crítico en chunk ${nextChunkIndex + 1}/${totalChunks} después de ${MAX_CHUNK_RETRIES} intentos`,
          error: error.message,
          chunk_index: nextChunkIndex,
          total_chunks: totalChunks
        });
        
        // Establecemos error global si es un fallo crítico
        hasError = true;
        throw new Error(`Error crítico en chunk ${nextChunkIndex + 1} después de múltiples intentos: ${error.message}`);
      }
      
      // Continuamos con el siguiente chunk
      await processNextChunk(workerId);
    }
  };
  
  // Iniciamos los workers en paralelo
  const workerPromises = [];
  for (let i = 0; i < MAX_PARALLEL_CHUNKS; i++) {
    activeWorkers++;
    workerPromises.push(
      processNextChunk(i).catch(error => {
        console.error(`Worker ${i} failed:`, error);
        activeWorkers--;
        
        // Solo propagamos el error si todos los workers han fallado
        if (activeWorkers === 0 && !isCompleted) {
          isCompleted = true;
          throw error;
        }
      }).finally(() => {
        activeWorkers--;
        console.log(`Worker ${i} finished, ${activeWorkers} workers still active`);
      })
    );
  }
  
  // Esperamos a que todos los workers terminen
  try {
    await Promise.all(workerPromises);
    isCompleted = true;
    console.log(`All chunks processed successfully: ${totalChunks} chunks`);
  } catch (error) {
    // Solo registramos el error si no ha sido ya registrado por un worker
    if (!hasError) {
      hasError = true;
      console.error('Critical error in parallel processing:', error);
      throw error;
    }
  }
}
