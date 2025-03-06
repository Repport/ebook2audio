
import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "../utils/retryUtils";
import { LoggingService } from "@/utils/loggingService";
import { updateConversionProgress } from "../progressService";
import { ChunkProgressData } from "../types/chunks";

const MAX_RETRIES_PER_CHUNK = 2; // Reduced from 5 to avoid excessive retries

/**
 * Procesa un chunk de texto y lo convierte en audio
 */
export async function processChunk(
  chunk: string, 
  index: number,
  voiceId: string,
  totalChunks: number,
  conversionId?: string
): Promise<ArrayBuffer> {
  console.log(`Processing chunk ${index + 1}/${totalChunks}, size: ${chunk.length} characters`);
  
  // Generate a unique identifier for this specific chunk processing attempt
  const chunkRequestId = `chunk-${index}-${Date.now()}`;
  
  // Log para seguimiento detallado
  LoggingService.debug('conversion', {
    message: `Iniciando procesamiento de chunk ${index + 1}/${totalChunks}`,
    chunk_length: chunk.length,
    chunk_index: index,
    total_chunks: totalChunks,
    request_id: chunkRequestId
  });
  
  if (!chunk.trim()) {
    console.warn(`Empty chunk detected at index ${index}, using placeholder audio`);
    // En lugar de saltar, generamos un silencio breve para mantener continuidad
    const silencePlaceholder = new Uint8Array([
      0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    return silencePlaceholder.buffer;
  }

  // Update progress if we have a conversion ID
  if (conversionId) {
    const progressData: ChunkProgressData = {
      processedChunks: index,
      totalChunks: totalChunks,
      processedCharacters: index * (chunk.length || 0), // Estimate
      totalCharacters: totalChunks * (chunk.length || 0), // Estimate
      currentChunk: chunk.substring(0, 50) + "...",
      progress: Math.round((index / totalChunks) * 100),
      isCompleted: false
    };
    
    // Update progress in Supabase
    await updateConversionProgress(conversionId, progressData);
  }

  const requestBody = {
    text: chunk,
    voiceId: voiceId,
    chunkIndex: index,
    totalChunks: totalChunks,
    isChunk: true, // Flag explícito para indicar que es un chunk
    conversionId: conversionId, // Pass the conversionId if available
    requestId: chunkRequestId // Add a unique request ID
  };
  
  // Custom shouldRetry function to prevent retrying certain errors
  const shouldRetry = (error: any, attempt: number) => {
    // Don't retry after too many attempts
    if (attempt > MAX_RETRIES_PER_CHUNK) {
      return false;
    }
    
    // Don't retry specific errors that are unlikely to be resolved by retrying
    const nonRetryableErrors = [
      'Invalid response format',
      'Maximum chunk size exceeded',
      'Unauthorized',
      'Rate limit exceeded'
    ];
    
    // Check if error message contains any non-retryable phrases
    if (error && error.message) {
      for (const phrase of nonRetryableErrors) {
        if (error.message.includes(phrase)) {
          console.log(`Not retrying error: ${error.message}`);
          return false;
        }
      }
    }
    
    return true;
  };
  
  // Incrementamos el número de reintentos y añadimos backoff exponencial
  const response = await retryOperation(
    () => supabase.functions.invoke('convert-to-audio', { body: requestBody }),
    { 
      maxRetries: MAX_RETRIES_PER_CHUNK, 
      baseDelay: 1000,  
      operation: `Convert chunk ${index + 1}`,
      shouldRetry
    }
  );

  if (response.error) {
    console.error(`Edge function error for chunk ${index + 1} after multiple retries:`, response.error);
    
    // Log error detallado
    LoggingService.error('conversion', {
      message: `Error procesando chunk ${index + 1}/${totalChunks}`,
      error: response.error.message,
      chunk_index: index,
      total_chunks: totalChunks,
      request_id: chunkRequestId
    });
    
    // Update progress with error if we have a conversion ID
    if (conversionId) {
      const errorData: ChunkProgressData = {
        processedChunks: index,
        totalChunks: totalChunks,
        processedCharacters: index * (chunk.length || 0),
        totalCharacters: totalChunks * (chunk.length || 0),
        currentChunk: chunk.substring(0, 50) + "...",
        progress: Math.round((index / totalChunks) * 100),
        error: `Error crítico en chunk ${index + 1}: ${response.error.message}`,
        isCompleted: false
      };
      
      await updateConversionProgress(conversionId, errorData);
    }
    
    throw new Error(`Error crítico en chunk ${index + 1}: ${response.error.message}`);
  }

  if (!response.data) {
    console.error(`Empty response for chunk ${index + 1} after multiple retries:`, response);
    
    // Update progress with error if we have a conversion ID
    if (conversionId) {
      const errorData: ChunkProgressData = {
        processedChunks: index,
        totalChunks: totalChunks,
        processedCharacters: index * (chunk.length || 0),
        totalCharacters: totalChunks * (chunk.length || 0),
        currentChunk: chunk.substring(0, 50) + "...",
        progress: Math.round((index / totalChunks) * 100),
        error: `No se recibieron datos del edge function para el chunk ${index + 1}`,
        isCompleted: false
      };
      
      await updateConversionProgress(conversionId, errorData);
    }
    
    throw new Error(`No se recibieron datos del edge function para el chunk ${index + 1}`);
  }

  const { data } = response;

  // Log detallado para debugging
  console.log(`Received response for chunk ${index + 1}/${totalChunks}:`, {
    hasAudioContent: !!data.audioContent,
    contentLength: data.audioContent ? data.audioContent.length : 0,
    progress: data.progress || 'unknown',
    processingTime: data.processingTime || 'unknown',
    requestId: chunkRequestId
  });

  if (!data.audioContent) {
    console.error(`Missing audioContent for chunk ${index + 1} after multiple retries:`, data);
    
    // Update progress with error if we have a conversion ID
    if (conversionId) {
      const errorData: ChunkProgressData = {
        processedChunks: index,
        totalChunks: totalChunks,
        processedCharacters: index * (chunk.length || 0),
        totalCharacters: totalChunks * (chunk.length || 0),
        currentChunk: chunk.substring(0, 50) + "...",
        progress: Math.round((index / totalChunks) * 100),
        error: `Contenido de audio ausente para el chunk ${index + 1}`,
        isCompleted: false
      };
      
      await updateConversionProgress(conversionId, errorData);
    }
    
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
    
    // Log exitoso
    LoggingService.debug('conversion', {
      message: `Chunk ${index + 1}/${totalChunks} procesado exitosamente`,
      audio_size: bytes.length,
      chunk_index: index,
      total_chunks: totalChunks,
      progress: data.progress || Math.round(((index + 1) / totalChunks) * 100),
      request_id: chunkRequestId
    });
    
    // Update progress for successful chunk
    if (conversionId) {
      const successData: ChunkProgressData = {
        processedChunks: index + 1, // This chunk is now processed
        totalChunks: totalChunks,
        processedCharacters: (index + 1) * (chunk.length || 0),
        totalCharacters: totalChunks * (chunk.length || 0),
        currentChunk: index < totalChunks - 1 ? "Preparando siguiente chunk..." : "Finalizando...",
        progress: Math.round(((index + 1) / totalChunks) * 100),
        isCompleted: index === totalChunks - 1 // Mark as completed if this is the last chunk
      };
      
      await updateConversionProgress(conversionId, successData);
    }
    
    return bytes.buffer;
  } catch (error: any) {
    console.error(`Base64 conversion error for chunk ${index + 1}:`, error);
    
    // Update progress with error if we have a conversion ID
    if (conversionId) {
      const errorData: ChunkProgressData = {
        processedChunks: index,
        totalChunks: totalChunks,
        processedCharacters: index * (chunk.length || 0),
        totalCharacters: totalChunks * (chunk.length || 0),
        currentChunk: chunk.substring(0, 50) + "...",
        progress: Math.round((index / totalChunks) * 100),
        error: `Error al procesar los datos de audio para el chunk ${index + 1}: ${error.message}`,
        isCompleted: false
      };
      
      await updateConversionProgress(conversionId, errorData);
    }
    
    throw new Error(`Error al procesar los datos de audio para el chunk ${index + 1}: ${error.message}`);
  }
}
