
import { supabase } from '@/integrations/supabase/client';
import { safeSupabaseUpdate } from '@/services/conversion/utils/retryUtils';

export async function createConversionRecord(fileName: string, textHash: string, userId?: string) {
  const { data: conversionRecord, error } = await supabase
    .from('text_conversions')
    .insert({
      file_name: fileName,
      status: 'processing',
      text_hash: textHash,
      user_id: userId,
      progress: 0,
      processed_characters: 0,
      total_characters: 0
    })
    .select()
    .single();

  if (error || !conversionRecord) {
    throw new Error('Failed to create conversion record');
  }

  return conversionRecord.id;
}

export async function updateConversionRecord(id: string, duration: number, totalCharacters: number) {
  // Round the duration to the nearest integer since the database expects an integer
  const roundedDuration = Math.round(duration);
  
  console.log('Updating conversion record:', {
    id,
    roundedDuration,
    totalCharacters,
    originalDuration: duration
  });

  await safeSupabaseUpdate(
    supabase,
    'text_conversions',
    id,
    {
      status: 'completed',
      progress: 100,
      duration: roundedDuration,
      processed_characters: totalCharacters,
      total_characters: totalCharacters
    }
  );
}
