
import { supabase } from "@/integrations/supabase/client";
import { ChunkUpdate } from "../types/chunks";

export async function updateChunkStatus(update: ChunkUpdate): Promise<void> {
  const { error } = await supabase
    .from('conversion_chunks')
    .upsert(update)
    .eq('conversion_id', update.conversion_id)
    .eq('chunk_index', update.chunk_index);

  if (error) {
    console.error('Error updating chunk status:', error);
    throw error;
  }
}
