
import { supabase } from '@/integrations/supabase/client';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export const saveToSupabase = async (
  audio: ArrayBuffer,
  extractedText: string,
  duration: number,
  fileName: string,
  userId: string
) => {
  // Generate a unique file path for storage
  const filePath = `${userId}/${crypto.randomUUID()}.mp3`;
  
  try {
    // Split large files into chunks
    const chunks = splitArrayBuffer(audio, CHUNK_SIZE);
    
    // Upload the chunks sequentially
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isLastChunk = i === chunks.length - 1;
      
      const { error: uploadError } = await supabase.storage
        .from('audio_cache')
        .uploadBinaryData(filePath, chunk, {
          contentType: 'audio/mpeg',
          upsert: true
        });

      if (uploadError) {
        console.error(`Chunk ${i + 1}/${chunks.length} upload error:`, uploadError);
        throw uploadError;
      }
      
      console.log(`Uploaded chunk ${i + 1}/${chunks.length}`);
    }

    // Generate a hash of the text content to identify duplicate conversions
    const textHash = btoa(extractedText.slice(0, 100)).slice(0, 32);

    // Create a record in the text_conversions table
    const { error: dbError } = await supabase
      .from('text_conversions')
      .insert({
        file_name: fileName,
        storage_path: filePath,
        file_size: audio.byteLength,
        duration: Math.round(duration),
        user_id: userId,
        text_hash: textHash,
        status: 'completed'
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      throw dbError;
    }

    return filePath;
  } catch (error) {
    // Clean up any partially uploaded file if there's an error
    await supabase.storage
      .from('audio_cache')
      .remove([filePath]);
    
    throw error;
  }
};

// Helper function to split ArrayBuffer into chunks
function splitArrayBuffer(buffer: ArrayBuffer, chunkSize: number): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  const totalChunks = Math.ceil(buffer.byteLength / chunkSize);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, buffer.byteLength);
    const chunk = new Uint8Array(buffer.slice(start, end));
    chunks.push(chunk);
  }
  
  return chunks;
}

