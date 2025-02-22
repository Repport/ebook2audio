
import { supabase } from "@/integrations/supabase/client";
import { updateConversionStatus } from "./conversionManager";
import { decodeBase64Audio, combineAudioChunks } from "./utils/audioUtils";
import { splitTextIntoChunks } from "./utils";

const MAX_CONCURRENT_CHUNKS = 5;
const CHUNK_TIMEOUT = 60000; // 60 segundos

interface AudioResponse {
  data: {
    audioContent: string;
  };
}

async function processChunkWithTimeout(
  chunk: string,
  chunkIndex: number,
  voiceId: string,
  fileName: string | undefined
): Promise<ArrayBuffer> {
  console.log(`Starting to process chunk ${chunkIndex} with length ${chunk.length}`);
  
  // Verificar tamaño del chunk
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

async function processChunkBatch(
  chunks: string[],
  startIndex: number,
  voiceId: string,
  fileName: string | undefined,
  conversionId: string,
  totalChunks: number,
  totalCharacters: number
): Promise<ArrayBuffer[]> {
  console.log(`Processing batch starting at index ${startIndex} with ${chunks.length} chunks`);
  
  const promises = chunks.map((chunk, index) =>
    processChunkWithTimeout(chunk, startIndex + index, voiceId, fileName)
      .then(async (audioBuffer) => {
        const completedChunks = startIndex + index + 1;
        const progress = Math.round((completedChunks / totalChunks) * 90) + 5;
        const chunkCharacters = chunk.length;
        
        console.log(`Chunk ${startIndex + index} completed. Progress: ${progress}%. Characters: ${chunkCharacters}`);
        
        const { error: incrementError } = await supabase.rpc('increment_processed_characters', {
          p_conversion_id: conversionId,
          p_increment: chunkCharacters,
          p_progress: progress,
          p_total_characters: totalCharacters,
          p_processed_chunks: completedChunks,
          p_total_chunks: totalChunks
        });

        if (incrementError) {
          console.error(`Error incrementing processed characters for chunk ${startIndex + index}:`, incrementError);
          throw incrementError;
        }

        return audioBuffer;
      })
  );

  return Promise.all(promises);
}

export async function processConversionChunks(
  text: string,
  voiceId: string,
  fileName: string | undefined,
  conversionId: string
): Promise<ArrayBuffer> {
  console.log('Starting parallel chunk processing...');
  
  // Usar la nueva función de división inteligente
  const chunks = splitTextIntoChunks(text);
  const totalChunks = chunks.length;
  const totalCharacters = text.length;
  const audioBuffers: ArrayBuffer[] = [];

  console.log(`Split text into ${chunks.length} chunks`);
  chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1}: ${chunk.length} characters`);
  });

  // Actualizar estado inicial
  await supabase
    .from('text_conversions')
    .update({
      status: 'processing',
      progress: 5,
      total_chunks: totalChunks,
      processed_chunks: 0,
      total_characters: totalCharacters,
      processed_characters: 0
    })
    .eq('id', conversionId);

  for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_CHUNKS) {
    const batchChunks = chunks.slice(i, i + MAX_CONCURRENT_CHUNKS);
    console.log(`Processing batch ${i / MAX_CONCURRENT_CHUNKS + 1}, chunks ${i + 1}-${i + batchChunks.length} of ${totalChunks}`);

    const batchBuffers = await processChunkBatch(
      batchChunks,
      i,
      voiceId,
      fileName,
      conversionId,
      totalChunks,
      totalCharacters
    );

    audioBuffers.push(...batchBuffers);
  }

  // Actualizar el estado final
  await updateConversionStatus(conversionId, 'completed', undefined, 100);

  console.log('All chunks processed successfully');
  return combineAudioChunks(audioBuffers);
}
