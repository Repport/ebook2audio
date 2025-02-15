
import { supabase } from "@/integrations/supabase/client";
import { CacheError } from './errors/CacheError';
import { retryOperation } from './utils/retryUtils';
import { downloadFromStorage, uploadToStorage } from './storage/cacheStorage';

const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

interface CacheRecord {
  storage_path: string;
}

export async function checkCache(textHash: string): Promise<{ storagePath: string | null; error: CacheError | null }> {
  try {
    console.log('Checking cache for text hash:', textHash);
    
    const result = await retryOperation(async () => {
      const { data, error } = await supabase
        .from('text_conversions')
        .select('storage_path')
        .eq('text_hash', textHash)
        .eq('status', 'completed')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      return { data: data as CacheRecord | null, error };
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
            status: 'completed'
          });
        
        if (error?.code === '23505') {
          console.log('Conversion already exists in completed state');
          return { error: null };
        }
        
        if (error) throw error;
        return { error: null };
      },
      { operation: 'Database insert' }
    );

    console.log('Successfully saved cache record to database');
    return { error: null };
  } catch (error) {
    console.error('Cache save failed:', error);
    return { error: error as Error };
  }
}

export async function cleanupExpiredCache(): Promise<{ error: Error | null }> {
  try {
    const now = new Date().toISOString();
    
    const { data: expiredRecords, error: fetchError } = await supabase
      .from('text_conversions')
      .select('storage_path')
      .lt('expires_at', now)
      .limit(100);

    if (fetchError) throw new CacheError('Failed to fetch expired records', fetchError);

    if (expiredRecords?.length) {
      const storagePaths = expiredRecords
        .map(record => (record as CacheRecord).storage_path)
        .filter((path): path is string => !!path);

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('audio_cache')
          .remove(storagePaths);

        if (storageError) throw new CacheError('Failed to delete expired files', storageError);
      }
    }

    const { error: dbError } = await supabase
      .from('text_conversions')
      .delete()
      .lt('expires_at', now);

    if (dbError) throw new CacheError('Failed to delete expired records', dbError);

    return { error: null };
  } catch (error) {
    console.error('Cache cleanup failed:', error);
    return { error: error instanceof Error ? error : new CacheError('Unknown error during cleanup') };
  }
}
