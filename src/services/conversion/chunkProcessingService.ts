
import { supabase } from "@/integrations/supabase/client";
import { updateConversionStatus } from "./conversionManager";
import { combineAudioChunks } from "./utils/audioUtils";
import { splitTextIntoChunks } from "./utils";
import { processChunkBatch } from "./batchProcessor";
import type { ChunkProcessingOptions } from "./types/chunks";

const MAX_CONCURRENT_CHUNKS = 5;
const CHUNK_SIZE = 4800;

export async function processConversionChunks(
  text: string,
  voiceId: string,
  fileName: string | undefined,
  conversionId: string
): Promise<ArrayBuffer> {
  console.log('Starting parallel chunk processing...');
  
  const chunks = splitTextIntoChunks(text, CHUNK_SIZE);
  const totalChunks = chunks.length;
  const totalCharacters = text.length;
  const audioBuffers: ArrayBuffer[] = [];

  console.log(`Split text into ${chunks.length} chunks`);
  chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1}: ${chunk.length} characters`);
    if (chunk.length > CHUNK_SIZE) {
      throw new Error(`Chunk ${index + 1} exceeds maximum size of ${CHUNK_SIZE} characters (${chunk.length})`);
    }
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

  const options: ChunkProcessingOptions = {
    voiceId,
    fileName,
    conversionId,
    totalChunks,
    totalCharacters
  };

  for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_CHUNKS) {
    const batchChunks = chunks.slice(i, i + MAX_CONCURRENT_CHUNKS);
    console.log(`Processing batch ${i / MAX_CONCURRENT_CHUNKS + 1}, chunks ${i + 1}-${i + batchChunks.length} of ${totalChunks}`);
    console.log('Batch chunks sizes:', batchChunks.map(chunk => chunk.length));

    const batchBuffers = await processChunkBatch(
      batchChunks,
      i,
      options
    );

    audioBuffers.push(...batchBuffers);
  }

  // Actualizar el estado final
  await updateConversionStatus(conversionId, 'completed', undefined, 100);

  console.log('All chunks processed successfully');
  return combineAudioChunks(audioBuffers);
}
