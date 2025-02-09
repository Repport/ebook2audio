
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
    const result = await retryOperation(async () => {
      const { data, error } = await supabase
        .from('text_conversions')
        .select('*')
        .eq('text_hash', textHash)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      return { data, error };
    });

    if (result.error) {
      console.error('Cache check error:', result.error);
      return { storagePath: null, error: result.error };
    }

    return { 
      storagePath: result.data?.storage_path || null, 
      error: null 
    };
  } catch (error) {
    console.error('Cache check failed after retries:', error);
    return { storagePath: null, error: error as Error };
  }
}

export async function fetchFromCache(storagePath: string): Promise<{ data: ArrayBuffer | null; error: Error | null }> {
  try {
    const result = await retryOperation(async () => {
      const { data, error } = await supabase.storage
        .from('audio_cache')
        .download(storagePath);
      
      return { data, error };
    });

    if (result.error) {
      console.error('Cache fetch error:', result.error);
      return { data: null, error: result.error };
    }

    return { 
      data: await result.data.arrayBuffer(), 
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

    const uploadResult = await retryOperation(async () => {
      const { error } = await supabase.storage
        .from('audio_cache')
        .upload(storagePath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });
      
      return { error };
    });

    if (uploadResult.error) {
      console.error('Cache storage error:', uploadResult.error);
      return { error: uploadResult.error };
    }

    const insertResult = await retryOperation(async () => {
      const { error } = await supabase
        .from('text_conversions')
        .insert({
          text_hash: textHash,
          storage_path: storagePath,
          file_name: fileName,
          file_size: audioBuffer.byteLength,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days expiration
        });
      
      return { error };
    });

    if (insertResult.error) {
      console.error('Cache database error:', insertResult.error);
      return { error: insertResult.error };
    }

    return { error: null };
  } catch (error) {
    console.error('Cache save failed after retries:', error);
    return { error: error as Error };
  }
}
