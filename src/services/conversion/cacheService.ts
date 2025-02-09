
import { supabase } from "@/integrations/supabase/client";

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

    // Exponential backoff with jitter
    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount) + Math.random() * 1000;
    console.log(`Retry attempt ${retryCount + 1} after ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryOperation(operation, retryCount + 1);
  }
}

export async function checkCache(textHash: string): Promise<{ storagePath: string | null; error: Error | null }> {
  try {
    const { data: existingConversion, error } = await retryOperation(() =>
      supabase
        .from('text_conversions')
        .select('*')
        .eq('text_hash', textHash)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()
    );

    if (error) {
      console.error('Cache check error:', error);
      return { storagePath: null, error };
    }

    return { 
      storagePath: existingConversion?.storage_path || null, 
      error: null 
    };
  } catch (error) {
    console.error('Cache check failed after retries:', error);
    return { storagePath: null, error: error as Error };
  }
}

export async function fetchFromCache(storagePath: string): Promise<{ data: ArrayBuffer | null; error: Error | null }> {
  try {
    const { data: audioData, error: downloadError } = await retryOperation(() =>
      supabase.storage
        .from('audio_cache')
        .download(storagePath)
    );

    if (downloadError) {
      console.error('Cache fetch error:', downloadError);
      return { data: null, error: downloadError };
    }

    return { 
      data: await audioData.arrayBuffer(), 
      error: null 
    };
  } catch (error) {
    console.error('Cache fetch failed after retries:', error);
    return { data: null, error: error as Error };
  }
}

export async function saveToCache(textHash: string, audioBuffer: ArrayBuffer, fileName?: string): Promise<{ error: Error | null }> {
  try {
    const storagePath = `${textHash}.mp3`;

    const { error: uploadError } = await retryOperation(() =>
      supabase.storage
        .from('audio_cache')
        .upload(storagePath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        })
    );

    if (uploadError) {
      console.error('Cache storage error:', uploadError);
      return { error: uploadError };
    }

    const { error: insertError } = await retryOperation(() =>
      supabase
        .from('text_conversions')
        .insert({
          text_hash: textHash,
          storage_path: storagePath,
          file_name: fileName,
          file_size: audioBuffer.byteLength,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days expiration
        })
    );

    if (insertError) {
      console.error('Cache database error:', insertError);
      return { error: insertError };
    }

    return { error: null };
  } catch (error) {
    console.error('Cache save failed after retries:', error);
    return { error: error as Error };
  }
}
