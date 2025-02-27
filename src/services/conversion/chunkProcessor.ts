
import { supabase } from "@/integrations/supabase/client";
import { AudioResponse } from "./types/chunks";
import { decodeBase64Audio } from "./audio/audioUtils";

const CHUNK_TIMEOUT = 60000; // 60 segundos

export async function processChunkWithTimeout(
  chunk: string,
  chunkIndex: number,
  voiceId: string,
  fileName: string | undefined
): Promise<ArrayBuffer> {
  console.log(`Starting to process chunk ${chunkIndex} with length ${chunk.length}`);
  
  if (chunk.length > 4800) {
    throw new Error(`Chunk ${chunkIndex} exceeds maximum size of 4800 characters (${chunk.length})`);
  }
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Chunk processing timeout')), CHUNK_TIMEOUT);
  });

  try {
    console.log(`Invoking convert-to-audio for chunk ${chunkIndex}`);
    const { data, error } = await Promise.race([
      supabase.functions.invoke<AudioResponse>('convert-to-audio', {
        body: {
          text: chunk,
          voiceId,
          fileName,
          isChunk: true,
          chunkIndex
        }
      }),
      timeoutPromise
    ]) as { data?: AudioResponse; error?: Error };

    if (error) {
      console.error(`Error processing chunk ${chunkIndex}:`, error);
      throw error;
    }

    if (!data?.data?.audioContent) {
      console.error(`No audio content received for chunk ${chunkIndex}`);
      throw new Error('No audio content received');
    }
    
    console.log(`Successfully processed chunk ${chunkIndex}`);
    return decodeBase64Audio(data.data.audioContent);
  } catch (error) {
    console.error(`Failed to process chunk ${chunkIndex}:`, error);
    if (error.message === 'Chunk processing timeout') {
      console.error(`Chunk ${chunkIndex} timed out after ${CHUNK_TIMEOUT}ms`);
    }
    throw error;
  }
}
