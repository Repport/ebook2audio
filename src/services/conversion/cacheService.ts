
import { supabase } from "@/integrations/supabase/client";

export async function checkCache(textHash: string): Promise<{ storagePath: string | null; error: Error | null }> {
  const { data: existingConversion, error } = await supabase
    .from('text_conversions')
    .select('*')
    .eq('text_hash', textHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) {
    return { storagePath: null, error };
  }

  return { 
    storagePath: existingConversion?.storage_path || null, 
    error: null 
  };
}

export async function fetchFromCache(storagePath: string): Promise<{ data: ArrayBuffer | null; error: Error | null }> {
  const { data: audioData, error: downloadError } = await supabase.storage
    .from('audio_cache')
    .download(storagePath);

  if (downloadError) {
    return { data: null, error: downloadError };
  }

  return { 
    data: await audioData.arrayBuffer(), 
    error: null 
  };
}

export async function saveToCache(textHash: string, audioBuffer: ArrayBuffer, fileName?: string): Promise<{ error: Error | null }> {
  const storagePath = `${textHash}.mp3`;

  const { error: uploadError } = await supabase.storage
    .from('audio_cache')
    .upload(storagePath, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true
    });

  if (uploadError) {
    return { error: uploadError };
  }

  const { error: insertError } = await supabase
    .from('text_conversions')
    .insert({
      text_hash: textHash,
      storage_path: storagePath,
      file_name: fileName,
      file_size: audioBuffer.byteLength
    });

  return { error: insertError || null };
}
