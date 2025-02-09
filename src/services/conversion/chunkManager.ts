
import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "./utils";

const BATCH_SIZE = 50;

export async function insertChunksBatch(
  chunks: { chunk_text: string; chunk_index: number }[], 
  conversionId: string
): Promise<void> {
  const batches = [];
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    batches.push(chunks.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    await retryOperation(async () => {
      const { error } = await supabase
        .from('conversion_chunks')
        .insert(
          batch.map(chunk => ({
            conversion_id: conversionId,
            chunk_text: chunk.chunk_text,
            chunk_index: chunk.chunk_index,
            status: 'pending'
          }))
        );

      if (error) {
        if (error.code === '57014') { // Statement timeout error
          console.error('Timeout error during chunk insertion, will retry with smaller batch');
          const midPoint = Math.floor(batch.length / 2);
          await insertChunksBatch(batch.slice(0, midPoint), conversionId);
          await insertChunksBatch(batch.slice(midPoint), conversionId);
        } else {
          throw error;
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

export async function getExistingChunks(conversionId: string): Promise<number[]> {
  const { data: existingChunks, error: chunksError } = await supabase
    .from('conversion_chunks')
    .select('chunk_index')
    .eq('conversion_id', conversionId);

  if (chunksError) throw chunksError;
  return (existingChunks || []).map(chunk => chunk.chunk_index);
}
