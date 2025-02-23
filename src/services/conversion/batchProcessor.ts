
import { supabase } from "@/integrations/supabase/client";
import { ChunkProcessingOptions } from "./types/chunks";
import { processChunkWithTimeout } from "./chunkProcessor";

export async function processChunkBatch(
  chunks: string[],
  startIndex: number,
  options: ChunkProcessingOptions
): Promise<ArrayBuffer[]> {
  console.log(`Processing batch starting at index ${startIndex} with ${chunks.length} chunks`);
  
  const { voiceId, fileName, conversionId, totalChunks, totalCharacters } = options;
  
  const promises = chunks.map((chunk, index) => {
    // Verificar tamaño del chunk antes de procesar
    if (chunk.length > 4800) {
      throw new Error(`Chunk ${startIndex + index} exceeds maximum size of 4800 characters (${chunk.length})`);
    }

    return processChunkWithTimeout(chunk, startIndex + index, voiceId, fileName)
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
      });
  });

  return Promise.all(promises);
}
