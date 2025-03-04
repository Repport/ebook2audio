
import { ChunkManager } from './chunkManager';
import { processChunksInParallel } from './parallelProcessing';
import { combineAudioBuffers } from './audioUtils';
import { TextChunkCallback } from '../types/chunks';
import { useConversionStore } from '@/store/conversionStore';
import { LoggingService } from '@/utils/loggingService';

/**
 * Servicio principal para la conversión de texto a audio
 */
export async function convertTextToAudio(
  text: string,
  voiceId: string,
  onProgress?: TextChunkCallback
): Promise<{ audio: ArrayBuffer; id: string }> {
  const conversionStartTime = Date.now();
  const conversionId = crypto.randomUUID();
  
  console.log(`[CONVERSION-${conversionId}] Starting conversion process with:`, {
    textLength: text?.length,
    voiceId,
    timestamp: new Date().toISOString()
  });

  try {
    if (!voiceId || typeof voiceId !== 'string') {
      throw new Error('El parámetro voiceId debe ser una cadena no vacía');
    }
    
    if (!text || typeof text !== 'string') {
      throw new Error('El parámetro text debe ser una cadena no vacía');
    }

    // Initialize the store with proper values at the start
    const store = useConversionStore.getState();
    store.startConversion(null);
    
    // Log the store initialization
    console.log(`[CONVERSION-${conversionId}] Store initialized:`, {
      status: store.status,
      progress: store.progress,
      chunks: store.chunks
    });
    
    // Update total character count
    store.updateProgress({
      processedChunks: 0,
      totalChunks: 0,
      processedCharacters: 0,
      totalCharacters: text.length,
      currentChunk: '',
      progress: 1 // Start with 1% visible
    });

    // Wrapper para el callback de progreso para asegurar actualizaciones consistentes
    const progressCallback: TextChunkCallback = (progressData) => {
      // Actualizar el store global de forma centralizada
      store.updateProgress(progressData);
      
      // Llamar al callback original si existe (para compatibilidad)
      if (onProgress) {
        onProgress(progressData);
      }
      
      // Enhanced log for debugging
      console.log(`[CONVERSION-${conversionId}] Progress update:`, {
        progress: `${progressData.progress}%`,
        chunks: `${progressData.processedChunks}/${progressData.totalChunks}`,
        chars: `${progressData.processedCharacters}/${progressData.totalCharacters}`,
        storeProgress: store.progress,
        storeStatus: store.status,
        timeSinceStart: `${Math.round((Date.now() - conversionStartTime) / 1000)}s`
      });
    };
    
    // Inicializar el gestor de chunks con callback centralizado
    const chunkManager = new ChunkManager(text, progressCallback);
    
    console.log(`[CONVERSION-${conversionId}] Chunk manager initialized:`, {
      totalChunks: chunkManager.getTotalChunks(),
      totalCharacters: chunkManager.getTotalCharacters()
    });
    
    // Log to monitoring system
    await LoggingService.info('conversion', {
      message: 'Started text to audio conversion',
      text_length: text.length,
      voice_id: voiceId,
      chunks_count: chunkManager.getTotalChunks()
    }, { entityId: conversionId });
    
    // Procesar los chunks en paralelo
    await processChunksInParallel(chunkManager, voiceId);
    
    // Verificación de integridad
    const missingChunks = chunkManager.getMissingChunks();
    if (missingChunks.length > 0) {
      console.error(`[CONVERSION-${conversionId}] CRITICAL INTEGRITY ERROR: Missing chunks after all processing attempts: ${missingChunks.join(', ')}`);
      store.setError(`Error crítico de integridad: No se pudieron procesar todos los chunks después de múltiples intentos`);
      throw new Error(`Error crítico de integridad: No se pudieron procesar todos los chunks después de múltiples intentos`);
    }
    
    // Combinar los buffers de audio
    const orderedBuffers = chunkManager.getOrderedBuffers();
    const finalAudioBuffer = combineAudioBuffers(orderedBuffers);
    
    // Verificación final de integridad
    if (!finalAudioBuffer || finalAudioBuffer.byteLength === 0) {
      console.error(`[CONVERSION-${conversionId}] CRITICAL: Final audio buffer is empty after all processing`);
      store.setError('Error crítico: El archivo de audio final está vacío después de todos los intentos');
      throw new Error('Error crítico: El archivo de audio final está vacío después de todos los intentos');
    }

    const conversionDuration = Math.round((Date.now() - conversionStartTime) / 1000);
    console.log(`[CONVERSION-${conversionId}] Audio conversion completed successfully:`, {
      finalSize: `${(finalAudioBuffer.byteLength / 1024).toFixed(2)} KB`,
      duration: `${conversionDuration}s`,
      avgSpeed: `${Math.round(text.length / conversionDuration)} chars/sec`
    });
    
    // Log completion to monitoring system
    await LoggingService.info('conversion', {
      message: 'Completed text to audio conversion',
      text_length: text.length,
      voice_id: voiceId,
      duration_seconds: conversionDuration,
      audio_size_bytes: finalAudioBuffer.byteLength
    }, { entityId: conversionId });
    
    // Notificar la finalización del proceso
    chunkManager.notifyCompletion();
    
    // Complete the conversion in the store
    store.completeConversion(finalAudioBuffer, conversionId, text.length / 15); // Approx 15 chars/second
    
    // Log final store state
    console.log(`[CONVERSION-${conversionId}] Final store state:`, {
      status: store.status,
      progress: store.progress,
      audioSize: store.audioData ? `${(store.audioData.byteLength / 1024).toFixed(2)} KB` : 'none'
    });
    
    return {
      audio: finalAudioBuffer,
      id: conversionId
    };
  } catch (error: any) {
    const errorTime = Math.round((Date.now() - conversionStartTime) / 1000);
    console.error(`[CONVERSION-${conversionId}] Fatal error after ${errorTime}s:`, error);
    
    // Log error to monitoring system
    await LoggingService.error('conversion', {
      message: error.message || 'Unknown error in conversion',
      error_time_seconds: errorTime,
      stack_trace: error.stack,
      text_length: text?.length
    }, { entityId: conversionId });
    
    // Asegurarnos de que el error se refleje en el store
    const store = useConversionStore.getState();
    store.setError(error.message || 'Error desconocido en la conversión');
    
    throw error;
  }
}
