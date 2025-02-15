
import { supabase } from '@/integrations/supabase/client';
import { retryOperation } from '../utils/retryUtils';

export async function downloadFromStorage(
  storagePath: string
): Promise<{ data: ArrayBuffer | null; error: Error | null }> {
  try {
    console.log('Downloading from storage:', storagePath);
    
    const result = await retryOperation(async () => {
      const { data, error } = await supabase.storage
        .from('audio_cache')
        .download(storagePath);
      
      if (error) throw error;
      return { data, error: null };
    });

    if (!result.data) {
      throw new Error('No data received from storage');
    }

    const arrayBuffer = await result.data.arrayBuffer();
    return { data: arrayBuffer, error: null };

  } catch (error) {
    console.error('Error downloading from storage:', error);
    return { data: null, error: error as Error };
  }
}

export async function uploadToStorage(
  storagePath: string,
  audioBuffer: ArrayBuffer
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage
      .from('audio_cache')
      .upload(storagePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error uploading to storage:', error);
    return { error: error as Error };
  }
}
