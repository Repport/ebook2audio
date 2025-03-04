
import { ChunkManager } from './chunkManager';
import { processChunksInParallel } from './parallelProcessing';
import { combineAudioBuffers } from './audioUtils';
import { TextChunkCallback } from '../types/chunks';
import { useConversionStore } from '@/store/conversionStore';
import { LoggingService } from '@/utils/loggingService';
import { updateConversionProgress } from '../progressService';

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

    // Create a wrapper function for the progress callback with real-time updates
    const progressCallback: TextChunkCallback = async (progressData) => {
      // Log complete data for debugging
      console.log(`[CONVERSION-${conversionId}] Raw progress data:`, JSON.stringify(progressData));
      
      // Ensure all fields are present
      const validatedData = {
        processedChunks: progressData.processedChunks || 0,
        totalChunks: progressData.totalChunks || 0,
        processedCharacters: progressData.processedCharacters || 0,
        totalCharacters: progressData.totalCharacters || text.length,
        currentChunk: progressData.currentChunk || '',
        progress: typeof progressData.progress === 'number' ? progressData.progress : 
                 (progressData.processedCharacters && progressData.totalCharacters ? 
                  Math.round((progressData.processedCharacters / progressData.totalCharacters) * 100) : 1),
        error: progressData.error,
        warning: progressData.warning,
        isCompleted: progressData.isCompleted
      };
      
      // Update the real-time progress in Supabase
      await updateConversionProgress(conversionId, validatedData);
      
      // Update the store directly to avoid reference problems
      store.updateProgress(validatedData);
      
      // Log validated data
      console.log(`[CONVERSION-${conversionId}] Validated progress update:`, {
        progress: `${validatedData.progress}%`,
        chunks: `${validatedData.processedChunks}/${validatedData.totalChunks}`,
        chars: `${validatedData.processedCharacters}/${validatedData.totalCharacters}`,
        storeProgress: store.progress,
        storeStatus: store.status
      });
      
      // Call the original callback if it exists
      if (onProgress) {
        onProgress(validatedData);
      }
    };
    
    // Initialize the chunk manager with the centralized callback
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
    
    // Process chunks in parallel
    await processChunksInParallel(chunkManager, voiceId);
    
    // Integrity check
    const missingChunks = chunkManager.getMissingChunks();
    if (missingChunks.length > 0) {
      console.error(`[CONVERSION-${conversionId}] CRITICAL INTEGRITY ERROR: Missing chunks after all processing attempts: ${missingChunks.join(', ')}`);
      store.setError(`Error crítico de integridad: No se pudieron procesar todos los chunks después de múltiples intentos`);
      throw new Error(`Error crítico de integridad: No se pudieron procesar todos los chunks después de múltiples intentos`);
    }
    
    // Combine audio buffers
    const orderedBuffers = chunkManager.getOrderedBuffers();
    const finalAudioBuffer = combineAudioBuffers(orderedBuffers);
    
    // Final integrity check
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
    
    // Notify completion
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
    
    // Make sure error is reflected in the store
    const store = useConversionStore.getState();
    store.setError(error.message || 'Error desconocido en la conversión');
    
    throw error;
  }
}
