
import { ChunkManager } from './chunkManager';
import { ProcessChunkResult } from './types/chunkTypes';
import { processChunk } from './chunkProcessor';
import { LoggingService } from '@/utils/loggingService';

// Configuración del procesamiento paralelo
const MAX_PARALLEL_CHUNKS = 2; // Reduced from 3 for less stress on the system
const MAX_CHUNK_RETRIES = 1; // Reduced to minimize repeated processing of the same chunk

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
  // Keep track of failed chunks to avoid infinite retries
  const failedChunks = new Set<number>();
  // Track processed chunks to avoid duplicates
  const processedChunks = new Set<number>();
  
  // Implementación del worker que procesa chunks
  const processNextChunk = async (workerId: number): Promise<void> => {
    if (isCompleted || hasError) return;
    
    // Primero intentamos procesar los chunks de la cola de reintentos
    let nextChunkIndex: number | undefined;
    if (retryQueue.length > 0) {
      nextChunkIndex = retryQueue.shift();
      
      // Skip this chunk if it has permanently failed or was already processed
      if (nextChunkIndex !== undefined && 
          (failedChunks.has(nextChunkIndex) || processedChunks.has(nextChunkIndex))) {
        console.log(`Worker ${workerId} skipping chunk ${nextChunkIndex + 1}/${totalChunks} - already processed or failed`);
        // Continue with next chunk
        await processNextChunk(workerId);
        return;
      }
      
      console.log(`Worker ${workerId} retrying chunk ${nextChunkIndex! + 1}/${totalChunks}`);
    } 
    // Si no hay reintentos pendientes, tomamos el siguiente chunk secuencial
    else if (chunkIndex < totalChunks) {
      nextChunkIndex = chunkIndex++;
      
      // Skip if this chunk was already processed
      if (processedChunks.has(nextChunkIndex)) {
        console.log(`Worker ${workerId} skipping chunk ${nextChunkIndex + 1}/${totalChunks} - already processed`);
        await processNextChunk(workerId);
        return;
      }
      
      console.log(`Worker ${workerId} processing chunk ${nextChunkIndex + 1}/${totalChunks}`);
    } 
    // Si no hay más chunks, terminamos
    else {
      console.log(`Worker ${workerId} has no more chunks to process`);
      return;
    }
    
    if (nextChunkIndex === undefined) return;
    
    try {
      // Mark this chunk as being processed to prevent duplicates
      processedChunks.add(nextChunkIndex);
      
      // Obtenemos el contenido del chunk
      const chunkText = chunkManager.getChunkContent(nextChunkIndex);
      
      // Generate a unique ID for this chunk processing attempt
      const chunkRequestId = `${conversionId}-chunk-${nextChunkIndex}-${Date.now()}`;
      
      // Procesamos el chunk y obtenemos el buffer de audio
      const buffer = await processChunk(
        chunkText, 
        nextChunkIndex, 
        voiceId, 
        totalChunks, 
        conversionId,
        chunkRequestId
      );
      
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
        
        // Remove from processed set to allow retry
        processedChunks.delete(nextChunkIndex);
        
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
        // Mark this chunk as permanently failed
        failedChunks.add(nextChunkIndex);
        
        // Si excedimos el número de reintentos, registramos un error fatal
        LoggingService.error('conversion', {
          message: `Fallo crítico en chunk ${nextChunkIndex + 1}/${totalChunks} después de ${MAX_CHUNK_RETRIES} intentos`,
          error: error.message,
          chunk_index: nextChunkIndex,
          total_chunks: totalChunks
        });
        
        // Continue with next chunks instead of failing the entire process
        console.log(`Chunk ${nextChunkIndex + 1} permanently failed after ${MAX_CHUNK_RETRIES} attempts - continuing with remaining chunks`);
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
    
    // Check if we have any permanently failed chunks
    if (failedChunks.size > 0) {
      console.warn(`Completed processing with ${failedChunks.size} permanently failed chunks out of ${totalChunks} total chunks`);
      // Continue with processing instead of failing completely
    } else {
      console.log(`All chunks processed successfully: ${totalChunks} chunks`);
    }
  } catch (error) {
    // Solo registramos el error si no ha sido ya registrado por un worker
    if (!hasError) {
      hasError = true;
      console.error('Critical error in parallel processing:', error);
      throw error;
    }
  }
}
