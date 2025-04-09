
import { supabase } from "@/integrations/supabase/client";
import { AudioResponse } from "./types/chunks";
import { decodeBase64Audio } from "./audio/audioUtils";

const CHUNK_TIMEOUT = 90000; // Incrementado a 90 segundos para archivos grandes

export async function processChunkWithTimeout(
  chunk: string,
  chunkIndex: number,
  voiceId: string,
  fileName: string | undefined
): Promise<ArrayBuffer> {
  console.log(`Starting to process chunk ${chunkIndex} with length ${chunk.length}`);
  
  if (!chunk || chunk.trim() === '') {
    console.warn(`Empty chunk ${chunkIndex} detected, skipping`);
    // Retornar un buffer de audio vacío para evitar errores
    return new ArrayBuffer(0);
  }
  
  if (chunk.length > 4800) {
    console.error(`Chunk ${chunkIndex} exceeds maximum size: ${chunk.length} chars`);
    throw new Error(`Chunk ${chunkIndex} exceeds maximum size of 4800 characters (${chunk.length})`);
  }
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Chunk ${chunkIndex} processing timeout after ${CHUNK_TIMEOUT/1000}s`)), CHUNK_TIMEOUT);
  });

  try {
    console.log(`Invoking convert-to-audio for chunk ${chunkIndex} with voice ${voiceId}`);
    
    // Generar un ID único para este intento
    const requestId = `chunk-${chunkIndex}-${Date.now()}`;
    
    const { data, error } = await Promise.race([
      supabase.functions.invoke<AudioResponse>('convert-to-audio', {
        body: {
          text: chunk,
          voiceId,
          fileName,
          isChunk: true,
          chunkIndex,
          requestId
        }
      }),
      timeoutPromise
    ]) as { data?: AudioResponse; error?: Error };

    if (error) {
      console.error(`Error processing chunk ${chunkIndex}:`, error);
      throw error;
    }

    if (!data?.data?.audioContent) {
      console.error(`No audio content received for chunk ${chunkIndex}:`, data);
      throw new Error(`No audio content received for chunk ${chunkIndex}`);
    }
    
    const audioContentLength = data.data.audioContent.length;
    console.log(`Successfully processed chunk ${chunkIndex}, audio content length: ${audioContentLength}`);
    
    if (audioContentLength < 10) {
      console.warn(`Warning: Very small audio content for chunk ${chunkIndex}: ${audioContentLength} chars`);
    }
    
    try {
      const audioBuffer = decodeBase64Audio(data.data.audioContent);
      console.log(`Decoded audio buffer for chunk ${chunkIndex}, size: ${audioBuffer.byteLength} bytes`);
      return audioBuffer;
    } catch (decodeError) {
      console.error(`Failed to decode audio data for chunk ${chunkIndex}:`, decodeError);
      throw new Error(`Error decodificando datos de audio para el chunk ${chunkIndex}: ${decodeError.message}`);
    }
  } catch (error) {
    console.error(`Failed to process chunk ${chunkIndex}:`, error);
    if (error.message?.includes('timeout')) {
      console.error(`Chunk ${chunkIndex} timed out after ${CHUNK_TIMEOUT/1000}s`);
    }
    throw error;
  }
}
