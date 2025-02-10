
import { supabase } from '@/integrations/supabase/client';

export const saveToSupabase = async (
  audio: ArrayBuffer,
  extractedText: string,
  duration: number,
  fileName: string,
  userId: string
) => {
  // Generate a unique file path for storage
  const filePath = `${userId}/${crypto.randomUUID()}.mp3`;
  
  // Upload the audio file to storage
  const { error: uploadError } = await supabase.storage
    .from('audio_cache')
    .upload(filePath, audio, {
      contentType: 'audio/mpeg',
      upsert: false
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw uploadError;
  }

  // Generate a hash of the text content to identify duplicate conversions
  const textHash = btoa(extractedText.slice(0, 100)).slice(0, 32);

  // Create a record in the text_conversions table
  const { error: dbError } = await supabase
    .from('text_conversions')
    .insert({
      file_name: fileName,
      storage_path: filePath,
      file_size: audio.byteLength,
      duration: Math.round(duration),
      user_id: userId,
      text_hash: textHash,
      status: 'completed'
    });

  if (dbError) {
    console.error('Database insert error:', dbError);
    throw dbError;
  }

  return filePath;
};
