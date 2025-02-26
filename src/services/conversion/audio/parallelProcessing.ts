
import { ChunkManager } from './chunkManager';
import { processChunk } from './chunkProcessor';
import { retryOperation } from '../utils';
import { createSilencePlaceholder } from './audioUtils';

const MAX_CONCURRENT_REQUESTS = 3;
const MAX_RETRIES_PER_CHUNK = 5;

/**
 * Procesa múltiples chunks en paralelo con un límite de concurrencia
 */
export async function processChunksInParallel(
  chunkManager: ChunkManager,
  voiceId: string
): Promise<void> {
  let currentIndex = 0;
  let failedChunks: number[] = [];
  const totalChunks = chunkManager.getTotalChunks();
  
  console.log(`Starting robust parallel processing with max ${MAX_CONCURRENT_REQUESTS} concurrent requests`);
  
  const getNextChunkIndex = (): number | null => {
    if (currentIndex >= totalChunks) {
      return null;
    }
    return currentIndex++;
  };

  const worker = async (): Promise<void> => {
    let nextIndex: number | null;
    
    while ((nextIndex = getNextChunkIndex()) !== null) {
      try {
        console.log(`Worker starting chunk ${nextIndex + 1}/${totalChunks}`);
        const chunk = chunkManager.getChunk(nextIndex);
        const buffer = await processChunk(chunk, nextIndex, voiceId, totalChunks);
        
        // Almacenar el buffer en el mapa con el índice como clave
        chunkManager.registerProcessedChunk(nextIndex, buffer);
        
        console.log(`Worker completed chunk ${nextIndex + 1}/${totalChunks} successfully`);
      } catch (error) {
        console.error(`Error processing chunk ${nextIndex}:`, error);
        failedChunks.push(nextIndex);
        
        chunkManager.registerChunkError(nextIndex, error as Error);
      }
    }
  };

  // Ejecutar trabajadores en paralelo con límite de concurrencia
  const workers = Array(Math.min(MAX_CONCURRENT_REQUESTS, totalChunks))
    .fill(null)
    .map(() => worker());
  
  await Promise.all(workers);
  
  console.log(`First pass completed. Processed ${totalChunks - failedChunks.length}/${totalChunks} chunks successfully. Failed: ${failedChunks.length}`);
  
  // Segunda pasada para reintentar chunks fallidos con máxima prioridad
  if (failedChunks.length > 0) {
    await retryFailedChunks(failedChunks, chunkManager, voiceId);
  }
}

/**
 * Reintenta procesar los chunks que fallaron en el primer intento
 */
async function retryFailedChunks(
  failedChunks: number[],
  chunkManager: ChunkManager,
  voiceId: string
): Promise<void> {
  console.log(`Starting second pass to retry ${failedChunks.length} failed chunks`);
  
  for (const failedIndex of failedChunks) {
    try {
      console.log(`Retrying failed chunk ${failedIndex + 1}/${chunkManager.getTotalChunks()} with higher priority`);
      
      const chunk = chunkManager.getChunk(failedIndex);
      
      // Intento especial con más reintentos y tiempos de espera más largos
      const buffer = await retryOperation(
        () => processChunk(chunk, failedIndex, voiceId, chunkManager.getTotalChunks()),
        { 
          maxRetries: MAX_RETRIES_PER_CHUNK * 2, // Duplicamos los reintentos 
          baseDelay: 2000, // Mayor tiempo entre reintentos
          operation: `Retry failed chunk ${failedIndex + 1}`
        }
      );
      
      chunkManager.registerProcessedChunk(failedIndex, buffer);
      
      console.log(`Successfully recovered chunk ${failedIndex + 1} in second pass`);
    } catch (error) {
      console.error(`CRITICAL: Failed to process chunk ${failedIndex + 1} even after extensive retries:`, error);
      
      // Como último recurso, crear un placeholder para mantener continuidad
      const silencePlaceholder = createSilencePlaceholder();
      
      chunkManager.registerProcessedChunk(failedIndex, silencePlaceholder);
      
      // El error ya fue registrado por registerProcessedChunk
    }
  }
}
