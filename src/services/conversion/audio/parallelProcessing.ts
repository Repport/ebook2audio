
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
  
  let activeWorkers = 0;
  let nextChunkIndex = 0;
  
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
    const currentIndex = nextChunkIndex++;
    
    if (currentIndex >= totalChunks) {
      activeWorkers--;
      return;
    }
    
    console.log(`Worker starting chunk ${currentIndex + 1}/${totalChunks}`);
    
    try {
      const chunk = chunkManager.getChunk(currentIndex);
      const buffer = await processChunk(chunk, currentIndex, voiceId, totalChunks);
      
      // Registrar el resultado exitoso
      chunkManager.registerProcessedChunk(currentIndex, buffer);
      
      // Procesar el siguiente chunk
      processNextChunk();
    } catch (error) {
      console.error(`Error processing chunk ${currentIndex + 1}/${totalChunks}:`, error);
      chunkManager.registerChunkError(currentIndex, error as Error);
      
      // A pesar del error, continuamos con el siguiente chunk
      processNextChunk();
    }
  };
  
  // Iniciar los workers
  await startInitialWorkers();
  
  // Esperar a que todos los chunks se procesen
  return new Promise<void>((resolve, reject) => {
    const checkCompletion = () => {
      if (chunkManager.areAllChunksProcessed()) {
        console.log('All chunks processed successfully');
        LoggingService.info('conversion', {
          message: 'Todos los chunks procesados exitosamente',
          total_chunks: totalChunks
        });
        resolve();
      } else if (activeWorkers === 0) {
        // Si no hay workers activos pero hay chunks sin procesar, hubo un problema
        const missingChunks = chunkManager.getMissingChunks();
        const error = new Error(`Procesamiento incompleto. Faltan chunks: ${missingChunks.join(', ')}`);
        console.error(error);
        LoggingService.error('conversion', {
          message: 'Procesamiento incompleto de chunks',
          missing_chunks: missingChunks
        });
        reject(error);
      } else {
        // Verificar nuevamente en 100ms
        setTimeout(checkCompletion, 100);
      }
    };
    
    // Iniciar verificación
    checkCompletion();
  });
}
