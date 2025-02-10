
import { supabase } from '@/integrations/supabase/client';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export interface AudioChunk {
  chunk: ArrayBuffer;
  index: number;
  hash: string;
}

export async function uploadAudioChunk(
  conversionId: string,
  chunk: AudioChunk
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Generate storage path for this chunk
    const chunkPath = `${conversionId}/${chunk.index}_${chunk.hash}.mp3`;
    
    // Upload chunk to storage
    const { error: uploadError } = await supabase.storage
      .from('audio_cache')
      .uploadBinaryData(chunkPath, chunk.chunk, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Record chunk metadata in database
    const { error: dbError } = await supabase
      .from('audio_chunks')
      .upsert({
        conversion_id: conversionId,
        chunk_index: chunk.index,
        chunk_hash: chunk.hash,
        storage_path: chunkPath,
        size: chunk.chunk.byteLength,
        status: 'uploaded'
      });

    if (dbError) throw dbError;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error uploading chunk:', error);
    return { success: false, error: error as Error };
  }
}

export async function splitAudioIntoChunks(audio: ArrayBuffer): Promise<AudioChunk[]> {
  const chunks: AudioChunk[] = [];
  let offset = 0;

  while (offset < audio.byteLength) {
    const end = Math.min(offset + CHUNK_SIZE, audio.byteLength);
    const chunk = audio.slice(offset, end);
    
    // Create a simple hash of the chunk
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      chunk
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);

    chunks.push({
      chunk,
      index: Math.floor(offset / CHUNK_SIZE),
      hash
    });

    offset += CHUNK_SIZE;
  }

  return chunks;
}

export async function checkAllChunksUploaded(conversionId: string): Promise<boolean> {
  const { data: chunks, error } = await supabase
    .from('audio_chunks')
    .select('status')
    .eq('conversion_id', conversionId)
    .eq('status', 'uploaded');

  if (error) {
    console.error('Error checking chunks status:', error);
    return false;
  }

  const { data: totalChunks, error: countError } = await supabase
    .from('audio_chunks')
    .select('chunk_index', { count: 'exact' })
    .eq('conversion_id', conversionId);

  if (countError) {
    console.error('Error getting total chunks:', countError);
    return false;
  }

  return chunks.length === totalChunks?.length;
}

export async function combineChunks(conversionId: string): Promise<ArrayBuffer | null> {
  try {
    // Get all chunks for this conversion
    const { data: chunks, error } = await supabase
      .from('audio_chunks')
      .select('*')
      .eq('conversion_id', conversionId)
      .order('chunk_index', { ascending: true });

    if (error) throw error;
    if (!chunks?.length) return null;

    const combinedChunks: ArrayBuffer[] = [];

    // Download and combine chunks
    for (const chunk of chunks) {
      const { data, error: downloadError } = await supabase.storage
        .from('audio_cache')
        .download(chunk.storage_path);

      if (downloadError) throw downloadError;
      
      const arrayBuffer = await data.arrayBuffer();
      combinedChunks.push(arrayBuffer);
    }

    // Combine all chunks into a single ArrayBuffer
    const totalLength = combinedChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of combinedChunks) {
      result.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    return result.buffer;
  } catch (error) {
    console.error('Error combining chunks:', error);
    return null;
  }
}
