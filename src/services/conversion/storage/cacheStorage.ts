
import { supabase } from "@/integrations/supabase/client";
import { CacheError } from '../errors/CacheError';
import { retryOperation } from '../utils/retryUtils';

export async function downloadFromStorage(
  storagePath: string
): Promise<{ data: ArrayBuffer | null; error: Error | null }> {
  try {
    console.log('Fetching from cache storage path:', storagePath);
    
    const result = await retryOperation(
      async () => {
        const { data, error } = await supabase.storage
          .from('audio_cache')
          .download(storagePath);
        
        if (error) throw error;
        return { data, error: null };
      },
      { operation: 'Cache fetch' }
    );

    if (!result.data) {
      console.error('No data found in cache');
      return { data: null, error: new Error('No data found in cache') };
    }

    const reader = result.data.stream().getReader();
    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      totalSize += value.length;
    }

    const combinedArray = new Uint8Array(totalSize);
    let position = 0;
    for (const chunk of chunks) {
      combinedArray.set(chunk, position);
      position += chunk.length;
    }

    console.log('Successfully fetched cached audio data');
    return { data: combinedArray.buffer, error: null };
  } catch (error) {
    console.error('Cache fetch failed:', error);
    return { data: null, error: error as Error };
  }
}

export async function uploadToStorage(
  storagePath: string,
  audioBuffer: ArrayBuffer
): Promise<{ error: Error | null }> {
  try {
    return await retryOperation(
      async () => {
        const { error } = await supabase.storage
          .from('audio_cache')
          .upload(storagePath, audioBuffer, {
            contentType: 'audio/mpeg',
            upsert: true,
            duplex: 'half'
          });
        
        if (error) throw error;
        return { error: null };
      },
      { operation: 'Storage upload' }
    );
  } catch (error) {
    console.error('Storage upload failed:', error);
    return { error: error as Error };
  }
}
