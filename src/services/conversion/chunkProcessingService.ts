
import { supabase } from "@/integrations/supabase/client";
import { splitTextIntoChunks } from "./utils";
import { updateConversionStatus } from "./conversionManager";
import { decodeBase64Audio, combineAudioChunks } from "./utils/audioUtils";

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
        
        // Actualizar el estado usando la nueva función increment_processed_characters
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

        // Actualizar el estado del chunk
        const { error: chunkError } = await supabase
          .from('conversion_chunks')
          .upsert({
            conversion_id: conversionId,
            chunk_index: startIndex + index,
            content: chunk,
            status: 'completed',
            audio_path: `chunk_${startIndex + index}.mp3`
          });

        if (chunkError) {
          console.error(`Error updating chunk ${startIndex + index} status:`, chunkError);
          throw chunkError;
        }
        
        return audioBuffer;
      })
      .catch(async (error) => {
        console.error(`Error processing chunk ${startIndex + index}:`, error);
        
        // Actualizar el estado de error del chunk
        await supabase
          .from('conversion_chunks')
          .upsert({
            conversion_id: conversionId,
            chunk_index: startIndex + index,
            content: chunk,
            status: 'failed',
            error_message: error.message
          });

        throw error;
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
  const chunks = splitTextIntoChunks(text);
  const totalChunks = chunks.length;
  const totalCharacters = text.length;
  const audioBuffers: ArrayBuffer[] = [];

  // Crear registros iniciales para todos los chunks
  const initialChunks = chunks.map((content, index) => ({
    conversion_id: conversionId,
    chunk_index: index,
    content,
    status: 'pending'
  }));

  // Insertar todos los chunks en la tabla
  const { error: insertError } = await supabase
    .from('conversion_chunks')
    .insert(initialChunks);

  if (insertError) {
    console.error('Error creating initial chunks:', insertError);
    throw insertError;
  }

  // Actualizar el número total de chunks en la conversión
  await supabase
    .from('text_conversions')
    .update({
      total_chunks: totalChunks,
      status: 'processing',
      progress: 0,
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

  // Actualizar el estado final de la conversión
  await supabase
    .from('text_conversions')
    .update({
      status: 'completed',
      progress: 100,
      processed_chunks: totalChunks,
      processed_characters: totalCharacters
    })
    .eq('id', conversionId);

  console.log('All chunks processed successfully');
  return combineAudioChunks(audioBuffers);
}
