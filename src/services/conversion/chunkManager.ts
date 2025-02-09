
import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "./utils";

const BATCH_SIZE = 50;

export async function insertChunksBatch(
  chunks: { chunk_text: string; chunk_index: number }[], 
  conversionId: string
): Promise<void> {
  // First get existing chunks to avoid duplicates
  const existingChunks = await getExistingChunks(conversionId);
  const existingIndexes = new Set(existingChunks);

  // Filter out chunks that already exist
  const newChunks = chunks.filter(chunk => !existingIndexes.has(chunk.chunk_index));

  if (newChunks.length === 0) {
    console.log('No new chunks to insert');
    return;
  }

  console.log(`Attempting to insert ${newChunks.length} new chunks`);

  const batches = [];
  for (let i = 0; i < newChunks.length; i += BATCH_SIZE) {
    batches.push(newChunks.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    await retryOperation(async () => {
      const { error } = await supabase
        .from('conversion_chunks')
        .upsert(
          batch.map(chunk => ({
            conversion_id: conversionId,
            chunk_text: chunk.chunk_text,
            chunk_index: chunk.chunk_index,
            status: 'pending'
          })),
          {
            onConflict: 'conversion_id,chunk_index',
            ignoreDuplicates: true
          }
        );

      if (error) {
        if (error.code === '57014') { // Statement timeout error
          console.error('Timeout error during chunk insertion, will retry with smaller batch');
          const midPoint = Math.floor(batch.length / 2);
          await insertChunksBatch(batch.slice(0, midPoint), conversionId);
          await insertChunksBatch(batch.slice(midPoint), conversionId);
        } else {
          console.error('Error inserting chunks:', error);
          throw error;
        }
      }
    }, { maxRetries: 3, initialDelay: 1000 });
    
    // Add small delay between batches to prevent overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

export async function getExistingChunks(conversionId: string): Promise<number[]> {
  const { data: existingChunks, error: chunksError } = await supabase
    .from('conversion_chunks')
    .select('chunk_index')
    .eq('conversion_id', conversionId)
    .order('chunk_index', { ascending: true });

  if (chunksError) {
    console.error('Error getting existing chunks:', chunksError);
    throw chunksError;
  }
  
  return (existingChunks || []).map(chunk => chunk.chunk_index);
}
