
import { supabase } from "@/integrations/supabase/client";

export async function checkCache(textHash: string): Promise<{ storagePath: string | null; error: Error | null }> {
  try {
    console.log('Checking cache for text hash:', textHash);
    
    const result = await supabase.rpc('set_statement_timeout');
    
    const { data, error } = await supabase
      .from('text_conversions')
      .select('storage_path')
      .eq('text_hash', textHash)
      .eq('status', 'completed')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (error) throw error;

    // Log whether we found a cached version or not
    if (data?.storage_path) {
      console.log('Found cached conversion with storage path:', data.storage_path);
    } else {
      console.log('No cached conversion found');
    }

    return { 
      storagePath: data?.storage_path || null, 
      error: null 
    };
  } catch (error) {
    console.error('Cache check failed:', error);
    return { storagePath: null, error: error as Error };
  }
}

export async function fetchFromCache(storagePath: string): Promise<{ data: ArrayBuffer | null; error: Error | null }> {
  try {
    console.log('Fetching from cache storage path:', storagePath);
    
    const { data, error } = await supabase.storage
      .from('audio_cache')
      .download(storagePath);
    
    if (error) throw error;
    if (!data) {
      throw new Error('No data found in cache');
    }

    console.log('Successfully fetched cached audio data');
    return { 
      data: await data.arrayBuffer(), 
      error: null 
    };
  } catch (error) {
    console.error('Cache fetch failed:', error);
    return { data: null, error: error as Error };
  }
}

export async function saveToCache(textHash: string, audioBuffer: ArrayBuffer, fileName?: string): Promise<{ error: Error | null }> {
  try {
    const storagePath = `${textHash}.mp3`;
    console.log('Saving to cache with storage path:', storagePath);

    // Split large files into chunks (5MB chunks)
    const CHUNK_SIZE = 5 * 1024 * 1024;
    const chunks = [];
    let offset = 0;
    
    while (offset < audioBuffer.byteLength) {
      chunks.push(audioBuffer.slice(offset, offset + CHUNK_SIZE));
      offset += CHUNK_SIZE;
    }

    // Upload chunks sequentially
    for (let i = 0; i < chunks.length; i++) {
      const { error: uploadError } = await supabase.storage
        .from('audio_cache')
        .upload(storagePath, new Uint8Array(chunks[i]), {
          contentType: 'audio/mpeg',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      console.log(`Uploaded chunk ${i + 1}/${chunks.length}`);
    }

    console.log('Successfully uploaded audio to storage');

    // Create the database record
    await supabase.rpc('set_statement_timeout');
    
    const { error: dbError } = await supabase
      .from('text_conversions')
      .upsert({
        text_hash: textHash,
        storage_path: storagePath,
        file_name: fileName,
        file_size: audioBuffer.byteLength,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        status: 'completed'
      })
      .select()
      .maybeSingle();
    
    if (dbError?.code === '23505') {
      // If we get a unique constraint violation, it means another process completed the conversion
      // This is fine, just log it and continue
      console.log('Conversion already exists in completed state');
      return { error: null };
    }
    
    if (dbError) throw dbError;

    console.log('Successfully saved cache record to database');
    return { error: null };
  } catch (error) {
    console.error('Cache save failed:', error);
    return { error: error as Error };
  }
}
