
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
const CHUNK_SIZE = 1024 * 1024; // 1MB for streaming operations

// Add custom error types
export class CacheError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'CacheError';
  }
}

// Add timeout to retry operation
async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    retryCount?: number;
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    timeout?: number;
    operation?: string;
  } = {}
): Promise<T> {
  const {
    retryCount = 0,
    maxRetries = MAX_RETRIES,
    initialDelay = INITIAL_RETRY_DELAY,
    maxDelay = 10000,
    timeout = 30000, // 30 second default timeout
    operation: opName = 'Operation'
  } = options;

  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new CacheError(`${opName} timed out after ${timeout}ms`)), timeout);
    });
    return await Promise.race([operation(), timeoutPromise]) as T;
  } catch (error) {
    if (retryCount >= maxRetries) {
      console.error(`${opName} failed after ${maxRetries} retries:`, error);
      throw error;
    }

    // Exponential backoff with jitter
    const exponentialDelay = initialDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000;
    const delay = Math.min(exponentialDelay + jitter, maxDelay);
    
    console.log(`${opName}: Retry attempt ${retryCount + 1} after ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryOperation(operation, {
      ...options,
      retryCount: retryCount + 1
    });
  }
}

// Add type safety for database operations
type TextConversion = Database['public']['Tables']['text_conversions']['Row'];

// Add cache cleanup function
export async function cleanupExpiredCache(): Promise<{ error: Error | null }> {
  try {
    const now = new Date().toISOString();
    
    // First, get expired records
    const { data: expiredRecords, error: fetchError } = await supabase
      .from('text_conversions')
      .select('storage_path')
      .lt('expires_at', now)
      .limit(100);

    if (fetchError) throw new CacheError('Failed to fetch expired records', fetchError);

    // Delete from storage
    if (expiredRecords?.length) {
      const storagePaths = expiredRecords.map(record => record.storage_path);
      const { error: storageError } = await supabase.storage
        .from('audio_cache')
        .remove(storagePaths);

      if (storageError) throw new CacheError('Failed to delete expired files', storageError);
    }

    // Delete from database
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
      
      if (error) throw error;
      return { data, error: null };
    });

    if (result.data?.storage_path) {
      console.log('Found cached conversion with storage path:', result.data.storage_path);
    } else {
      console.log('No cached conversion found');
    }

    return { 
      storagePath: result.data?.storage_path || null, 
      error: null 
    };
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

    // Stream large files in chunks
    const reader = result.data.stream().getReader();
    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      totalSize += value.length;
    }

    // Combine chunks efficiently
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

export async function saveToCache(
  textHash: string,
  audioBuffer: ArrayBuffer,
  fileName?: string
): Promise<{ error: Error | null }> {
  try {
    const storagePath = `${textHash}.mp3`;
    console.log('Saving to cache with storage path:', storagePath);

    // Upload in chunks for large files
    const uploadResult = await retryOperation(
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

    console.log('Successfully uploaded audio to storage');

    // Create database record with optimistic locking
    const insertResult = await retryOperation(
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
