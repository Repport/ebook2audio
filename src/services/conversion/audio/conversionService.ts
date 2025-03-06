
import { ChunkManager } from './chunkManager';
import { processChunksInParallel } from './parallelProcessing';
import { combineAudioBuffers } from './audioUtils';
import { TextChunkCallback } from '../types/chunks';
import { useConversionStore } from '@/store/conversionStore';
import { LoggingService } from '@/utils/loggingService';
import { updateConversionProgress } from '../progressService';

// Global variable for throttling
const progressUpdateState = {
  lastUpdateTime: 0,
  lastHash: ''
};

/**
 * Main service for text-to-speech conversion
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

    // Initialize store with appropriate values
    const store = useConversionStore.getState();
    store.startConversion(null);
    
    // Log store initialization
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

    // Create a wrapper function for progress callback with real-time updates
    const progressCallback: TextChunkCallback = async (progressData) => {
      // Apply throttling to updates
      const now = Date.now();
      if (now - progressUpdateState.lastUpdateTime < 250) { // 250ms between updates
        return;
      }
      
      // Generate a simple hash of progress data to avoid repeated updates
      const progressHash = `${progressData.progress}-${progressData.processedChunks}/${progressData.totalChunks}`;
      if (progressHash === progressUpdateState.lastHash) {
        return;
      }
      
      progressUpdateState.lastUpdateTime = now;
      progressUpdateState.lastHash = progressHash;
      
      // Log full data for debugging
      console.log(`[CONVERSION-${conversionId}] Progress update:`, {
        progress: `${progressData.progress}%`, 
        chunks: `${progressData.processedChunks}/${progressData.totalChunks}`
      });
      
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
      
      try {
        // Update progress in real-time in Supabase
        await updateConversionProgress(conversionId, validatedData);
      } catch (updateError) {
        console.warn('Error updating progress, continuing with conversion:', updateError);
      }
      
      // Update the store directly to avoid reference issues
      store.updateProgress(validatedData);
      
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
    
    // Log in the monitoring system
    await LoggingService.info('conversion', {
      message: 'Started text to audio conversion',
      text_length: text.length,
      voice_id: voiceId,
      chunks_count: chunkManager.getTotalChunks()
    }, { entityId: conversionId });
    
    // Process chunks in parallel
    await processChunksInParallel(chunkManager, voiceId);
    
    // Check for processed chunks
    const orderedBuffers = chunkManager.getOrderedBuffers();
    
    // Integrity check - more tolerant approach
    const missingChunks = chunkManager.getMissingChunks();
    if (missingChunks.length > 0) {
      console.warn(`[CONVERSION-${conversionId}] WARNING: ${missingChunks.length} chunks could not be processed:`, missingChunks.join(', '));
      
      // If we have no processed chunks at all, that's a critical error
      if (orderedBuffers.length === 0) {
        console.error(`[CONVERSION-${conversionId}] CRITICAL: No chunks processed successfully after all attempts`);
        store.setError(`Error crítico: Ningún chunk se pudo procesar después de múltiples intentos`);
        throw new Error(`Error crítico: Ningún chunk se pudo procesar después de múltiples intentos`);
      }
      
      // Otherwise continue with what we have
      store.setWarning(`Advertencia: ${missingChunks.length} partes del texto no pudieron procesarse`);
    }
    
    // Combine available audio buffers
    if (orderedBuffers.length === 0) {
      console.error(`[CONVERSION-${conversionId}] CRITICAL: No audio buffers available after processing`);
      store.setError('Error crítico: No se generaron datos de audio');
      throw new Error('Error crítico: No se generaron datos de audio');
    }
    
    const finalAudioBuffer = combineAudioBuffers(orderedBuffers);
    
    // Final integrity check
    if (!finalAudioBuffer || finalAudioBuffer.byteLength === 0) {
      console.error(`[CONVERSION-${conversionId}] CRITICAL: Final audio buffer is empty after all processing`);
      store.setError('Error crítico: El archivo de audio final está vacío después de todos los intentos');
      throw new Error('Error crítico: El archivo de audio final está vacío después de todos los intentos');
    }

    // Calculate some stats
    const successRate = ((orderedBuffers.length / chunkManager.getTotalChunks()) * 100).toFixed(1);
    const conversionDuration = Math.round((Date.now() - conversionStartTime) / 1000);
    
    console.log(`[CONVERSION-${conversionId}] Audio conversion completed successfully:`, {
      finalSize: `${(finalAudioBuffer.byteLength / 1024).toFixed(2)} KB`,
      duration: `${conversionDuration}s`,
      avgSpeed: `${Math.round(text.length / conversionDuration)} chars/sec`,
      missingChunks: missingChunks.length,
      successRate: `${successRate}%`
    });
    
    // Log completion in the monitoring system
    await LoggingService.info('conversion', {
      message: 'Completed text to audio conversion',
      text_length: text.length,
      voice_id: voiceId,
      duration_seconds: conversionDuration,
      audio_size_bytes: finalAudioBuffer.byteLength,
      missing_chunks: missingChunks.length,
      success_rate: successRate
    }, { entityId: conversionId });
    
    // Notify completion
    chunkManager.notifyCompletion();
    
    // Complete the conversion in the store
    store.completeConversion(finalAudioBuffer, conversionId, text.length / 15); // Approx. 15 characters/second
    
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
    
    // Log error in the monitoring system
    await LoggingService.error('conversion', {
      message: error.message || 'Unknown error in conversion',
      error_time_seconds: errorTime,
      stack_trace: error.stack,
      text_length: text?.length
    }, { entityId: conversionId });
    
    // Ensure the error is reflected in the store
    const store = useConversionStore.getState();
    store.setError(error.message || 'Error desconocido en la conversión');
    
    throw error;
  }
}
