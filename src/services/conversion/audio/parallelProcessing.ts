
import { ChunkManager } from './chunkManager';
import { processChunk } from './chunkProcessor';
import { LoggingService } from '@/utils/loggingService';

// Definir un número óptimo de procesamiento paralelo basado en recursos disponibles
const OPTIMAL_PARALLEL_CHUNKS = typeof navigator !== 'undefined' && navigator.hardwareConcurrency 
  ? Math.max(2, Math.min(4, navigator.hardwareConcurrency - 1)) 
  : 2;

/**
 * Procesa múltiples chunks en paralelo de forma controlada
 */
export async function processChunksInParallel(
  chunkManager: ChunkManager,
  voiceId: string
): Promise<void> {
  const chunks = chunkManager.getAllChunks();
  const totalChunks = chunks.length;
  
  // Log inicial
  console.log(`Starting parallel processing of ${totalChunks} chunks with ${OPTIMAL_PARALLEL_CHUNKS} workers`);
  LoggingService.info('conversion', {
    message: 'Iniciando procesamiento paralelo de chunks',
    total_chunks: totalChunks,
    parallel_workers: OPTIMAL_PARALLEL_CHUNKS
  });
  
  // First notify total chunks to ensure UI displays correctly
  const totalCharacters = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  chunkManager.updateInitialMetadata(totalChunks, totalCharacters);
  
  let activeWorkers = 0;
  let nextChunkIndex = 0;
  let completedChunks = 0;
  let failedChunks = 0;
  let retryQueue: number[] = [];
  
  // Iniciar el primer lote de workers
  const startInitialWorkers = async () => {
    const initialWorkers = Math.min(OPTIMAL_PARALLEL_CHUNKS, totalChunks);
    
    for (let i = 0; i < initialWorkers; i++) {
      if (nextChunkIndex < totalChunks) {
        activeWorkers++;
        processNextChunk();
      }
    }
  };
  
  // Procesar el siguiente chunk disponible
  const processNextChunk = async () => {
    // First try to process chunks from retry queue
    let currentIndex: number;
    
    if (retryQueue.length > 0) {
      currentIndex = retryQueue.shift()!;
      console.log(`Worker retrying chunk ${currentIndex + 1}/${totalChunks}`);
    } else if (nextChunkIndex < totalChunks) {
      currentIndex = nextChunkIndex++;
      console.log(`Worker starting chunk ${currentIndex + 1}/${totalChunks}`);
    } else {
      activeWorkers--;
      return;
    }
    
    try {
      const chunk = chunkManager.getChunk(currentIndex);
      const buffer = await processChunk(chunk, currentIndex, voiceId, totalChunks);
      
      // Registrar el resultado exitoso
      chunkManager.registerProcessedChunk(currentIndex, buffer);
      completedChunks++;
      
      // Log progress to help debug
      console.log(`Chunk ${currentIndex + 1}/${totalChunks} processed successfully, progress: ${Math.round((completedChunks / totalChunks) * 100)}%`);
      
      // Procesar el siguiente chunk
      processNextChunk();
    } catch (error: any) {
      console.error(`Error processing chunk ${currentIndex + 1}/${totalChunks}:`, error);
      
      // Add to retry queue if we haven't retried too many times
      const retryAttempts = chunkManager.getRetryCount(currentIndex);
      if (retryAttempts < 3) {
        console.log(`Adding chunk ${currentIndex + 1} to retry queue (attempt ${retryAttempts + 1})`);
        chunkManager.incrementRetryCount(currentIndex);
        retryQueue.push(currentIndex);
      } else {
        console.error(`Chunk ${currentIndex + 1}/${totalChunks} failed after multiple retries`);
        chunkManager.registerChunkError(currentIndex, error as Error);
        failedChunks++;
      }
      
      // A pesar del error, continuamos con el siguiente chunk
      processNextChunk();
    }
  };
  
  // Iniciar los workers
  await startInitialWorkers();
  
  // Esperar a que todos los chunks se procesen
  return new Promise<void>((resolve, reject) => {
    const checkCompletion = () => {
      const allProcessed = completedChunks + failedChunks === totalChunks;
      const noActiveWorkers = activeWorkers === 0;
      
      if (completedChunks === totalChunks) {
        console.log('All chunks processed successfully');
        LoggingService.info('conversion', {
          message: 'Todos los chunks procesados exitosamente',
          total_chunks: totalChunks
        });
        resolve();
      } else if (allProcessed || (noActiveWorkers && retryQueue.length === 0)) {
        // Si hay chunks que fallaron, pero hemos terminado de procesar todo lo posible
        const missingChunks = chunkManager.getMissingChunks();
        if (missingChunks.length > 0) {
          const error = new Error(`Procesamiento incompleto. Faltan chunks: ${missingChunks.join(', ')}`);
          console.error(error);
          LoggingService.error('conversion', {
            message: 'Procesamiento incompleto de chunks',
            missing_chunks: missingChunks,
            completed_chunks: completedChunks,
            total_chunks: totalChunks
          });
          reject(error);
        } else {
          // Si no hay chunks faltantes pero tuvimos errores, seguimos adelante
          console.log(`Processing completed with ${failedChunks} failed chunks`);
          LoggingService.warn('conversion', {
            message: 'Procesamiento completado con errores',
            failed_chunks: failedChunks,
            completed_chunks: completedChunks,
            total_chunks: totalChunks
          });
          resolve();
        }
      } else {
        // Verificar nuevamente en 100ms
        setTimeout(checkCompletion, 100);
      }
    };
    
    // Iniciar verificación
    checkCompletion();
  });
}
