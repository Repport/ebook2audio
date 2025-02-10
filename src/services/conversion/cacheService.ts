
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

async function retryOperation<T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retryCount >= MAX_RETRIES) {
      throw error;
    }

    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount) + Math.random() * 1000;
    console.log(`Retry attempt ${retryCount + 1} after ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryOperation(operation, retryCount + 1);
  }
}

export async function checkCache(textHash: string): Promise<{ storagePath: string | null; error: Error | null }> {
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
    return { storagePath: null, error: error as Error };
  }
}

export async function fetchFromCache(storagePath: string): Promise<{ data: ArrayBuffer | null; error: Error | null }> {
  try {
    console.log('Fetching from cache storage path:', storagePath);
    
    const result = await retryOperation(async () => {
      const { data, error } = await supabase.storage
        .from('audio_cache')
        .download(storagePath);
      
      if (error) throw error;
      return { data, error: null };
    });

    if (!result.data) {
      console.error('No data found in cache');
      return { data: null, error: new Error('No data found in cache') };
    }

    console.log('Successfully fetched cached audio data');
    return { 
      data: await result.data.arrayBuffer(), 
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

    // First try to upload to storage
    const uploadResult = await retryOperation(async () => {
      const { error } = await supabase.storage
        .from('audio_cache')
        .upload(storagePath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });
      
      if (error) throw error;
      return { error: null };
    });

    console.log('Successfully uploaded audio to storage');

    // Then create the database record
    const insertResult = await retryOperation(async () => {
      const { error } = await supabase
        .from('text_conversions')
        .upsert({
          text_hash: textHash,
          storage_path: storagePath,
          file_name: fileName,
          file_size: audioBuffer.byteLength,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          status: 'completed'
        });
      
      if (error?.code === '23505') {
        console.log('Conversion already exists in completed state');
        return { error: null };
      }
      
      if (error) throw error;
      return { error: null };
    });

    console.log('Successfully saved cache record to database');
    return { error: null };
  } catch (error) {
    console.error('Cache save failed:', error);
    return { error: error as Error };
  }
}
