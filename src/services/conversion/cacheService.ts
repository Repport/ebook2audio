
import { supabase } from "@/integrations/supabase/client";
import { CacheError } from './errors/CacheError';
import { retryOperation } from './utils/retryUtils';
import { downloadFromStorage, uploadToStorage } from './storage/cacheStorage';

const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

export async function checkCache(textHash: string): Promise<{ storagePath: string | null; error: CacheError | null }> {
  try {
    console.log('Checking cache for text hash:', textHash);
    
    const result = await retryOperation(async () => {
      const { data, error } = await supabase
        .from('text_conversions')
        .select('storage_path')
        .eq('text_hash', textHash)
        .eq('status', 'completed')
        .eq('is_cached', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      return { data, error };
    });

    if (result.data?.storage_path) {
      console.log('Found cached conversion with storage path:', result.data.storage_path);
      return { storagePath: result.data.storage_path, error: null };
    }

    console.log('No cached conversion found');
    return { storagePath: null, error: null };

  } catch (error) {
    console.error('Cache check failed:', error);
    return { 
      storagePath: null, 
      error: new CacheError('Cache check failed', error) 
    };
  }
}

export async function fetchFromCache(
  storagePath: string
): Promise<{ data: ArrayBuffer | null; error: Error | null }> {
  return downloadFromStorage(storagePath);
}

export async function saveToCache(
  textHash: string,
  audioBuffer: ArrayBuffer,
  fileName?: string
): Promise<{ error: Error | null }> {
  try {
    const storagePath = `${textHash}.mp3`;
    console.log('Saving to cache with storage path:', storagePath);

    const uploadResult = await uploadToStorage(storagePath, audioBuffer);
    if (uploadResult.error) throw uploadResult.error;

    console.log('Successfully uploaded audio to storage');

    await retryOperation(
      async () => {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + CACHE_DURATION);

        const { error } = await supabase
          .from('text_conversions')
          .upsert({
            text_hash: textHash,
            storage_path: storagePath,
            file_name: fileName,
            file_size: audioBuffer.byteLength,
            expires_at: expiresAt.toISOString(),
            status: 'completed',
            is_cached: true,
            cache_created_at: now.toISOString()
          });
        
        if (error?.code === '23505') {
          console.log('Conversion already exists in completed state');
          
          // Update the existing record to mark as cached
          const { error: updateError } = await supabase
            .from('text_conversions')
            .update({
              is_cached: true,
              cache_created_at: now.toISOString()
            })
            .eq('text_hash', textHash);
            
          if (updateError) throw updateError;
          return { error: null };
        }
        
        if (error) throw error;
        return { error: null };
      },
      { operation: 'Database insert' }
    );

    console.log('Successfully saved cache record to database');
    
    // Log this caching operation to system_logs
    await supabase.from('system_logs').insert({
      event_type: 'cache',
      entity_id: null,
      details: {
        text_hash: textHash,
        file_name: fileName,
        file_size: audioBuffer.byteLength,
        storage_path: storagePath
      },
      status: 'success'
    });
    
    return { error: null };
  } catch (error) {
    console.error('Cache save failed:', error);
    
    // Log the error
    await supabase.from('system_logs').insert({
      event_type: 'cache',
      details: {
        text_hash: textHash,
        file_name: fileName,
        error: error.message
      },
      status: 'error'
    });
    
    return { error: error as Error };
  }
}

export async function cleanupExpiredCache(): Promise<{ error: Error | null }> {
  try {
    // We'll now use the improved cleanup_expired function directly
    const { error } = await supabase.rpc('cleanup_expired');
    
    if (error) throw new CacheError('Failed to execute cleanup function', error);
    
    return { error: null };
  } catch (error) {
    console.error('Cache cleanup failed:', error);
    return { error: error instanceof Error ? error : new CacheError('Unknown error during cleanup') };
  }
}
