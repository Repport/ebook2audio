
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
        
        // Update conversion progress directly with SQL
        const { error: updateError } = await supabase
          .from('conversion_progress')
          .upsert({
            conversion_id: conversionId,
            processed_chunks: completedChunks,
            total_chunks: totalChunks,
            processed_characters: chunkCharacters,
            total_characters: totalCharacters,
            progress: progress,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'conversion_id'
          });

        if (updateError) {
          console.error(`Error updating progress for chunk ${startIndex + index}:`, updateError);
          throw updateError;
        }

        return audioBuffer;
      });
  });

  return Promise.all(promises);
}
