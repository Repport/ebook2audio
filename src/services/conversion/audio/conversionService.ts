
import { ChunkManager } from './chunkManager';
import { processChunksInParallel } from './parallelProcessing';
import { combineAudioBuffers } from './audioUtils';
import { TextChunkCallback } from '../types/chunks';
import { useConversionStore } from '@/store/conversionStore';

/**
 * Servicio principal para la conversión de texto a audio
 */
export async function convertTextToAudio(
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

    // Inicializar el gestor de chunks
    const chunkManager = new ChunkManager(text, (progressData) => {
      // Actualizar el store global al mismo tiempo que llamamos al callback original
      const store = useConversionStore.getState();
      store.updateProgress(progressData);
      
      // Llamar al callback original si existe
      if (onProgress) {
        onProgress(progressData);
      }
    });
    
    // Procesar los chunks en paralelo
    await processChunksInParallel(chunkManager, voiceId);
    
    // Verificación de integridad
    const missingChunks = chunkManager.getMissingChunks();
    if (missingChunks.length > 0) {
      console.error(`CRITICAL INTEGRITY ERROR: Missing chunks after all processing attempts: ${missingChunks.join(', ')}`);
      throw new Error(`Error crítico de integridad: No se pudieron procesar todos los chunks después de múltiples intentos`);
    }
    
    // Combinar los buffers de audio
    const orderedBuffers = chunkManager.getOrderedBuffers();
    const finalAudioBuffer = combineAudioBuffers(orderedBuffers);
    
    // Verificación final de integridad
    if (!finalAudioBuffer || finalAudioBuffer.byteLength === 0) {
      console.error('CRITICAL: Final audio buffer is empty after all processing');
      throw new Error('Error crítico: El archivo de audio final está vacío después de todos los intentos');
    }

    console.log(`Audio conversion completed successfully with final size: ${finalAudioBuffer.byteLength} bytes`);
    
    // Generar un ID único para esta conversión
    const conversionId = crypto.randomUUID();
    
    // Notificar la finalización del proceso
    chunkManager.notifyCompletion();
    
    return {
      audio: finalAudioBuffer,
      id: conversionId
    };
  } catch (error: any) {
    console.error('Fatal error in convertToAudio:', error);
    
    // Asegurarnos de que el error se refleje en el store
    const store = useConversionStore.getState();
    store.setError(error.message || 'Error desconocido en la conversión');
    
    throw error;
  }
}
