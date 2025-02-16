
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
  await safeSupabaseUpdate(
    supabase,
    'text_conversions',
    id,
    {
      status: 'completed',
      progress: 100,
      duration,
      processed_characters: totalCharacters,
      total_characters: totalCharacters
    }
  );
}
