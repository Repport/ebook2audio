
import { supabase } from "@/integrations/supabase/client";
import { ChunkUpdate } from "../types/chunks";

export async function updateChunkStatus(update: ChunkUpdate): Promise<void> {
  const { error } = await supabase
    .from('conversion_chunks')
    .upsert(
      {
        conversion_id: update.conversion_id,
        chunk_index: update.chunk_index,
        chunk_text: update.chunk_text,
        status: update.status,
        audio_path: update.audio_path,
        error_message: update.error_message
      },
      {
        onConflict: 'conversion_id,chunk_index'
      }
    );

  if (error) {
    console.error('Error updating chunk status:', error);
    throw error;
  }
}
