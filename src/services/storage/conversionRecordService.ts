
import { supabase } from '@/integrations/supabase/client';

export async function createConversionRecord(
  conversionId: string,
  fileName: string,
  audioSize: number,
  compressedSize: number,
  compressionRatio: number,
  duration: number,
  userId: string,
  textHash: string,
  storagePath: string,
  compressedStoragePath: string
) {
  const { error: dbError } = await supabase
    .from('text_conversions')
    .insert({
      id: conversionId,
      file_name: fileName.replace('.mp3', '.m4a'),
      file_size: audioSize,
      compressed_size: compressedSize,
      compression_ratio: compressionRatio,
      duration: Math.round(duration),
      user_id: userId,
      text_hash: btoa(textHash.slice(0, 100)).slice(0, 32),
      status: 'processing',
      storage_path: storagePath,
      compressed_storage_path: compressedStoragePath
    });

  if (dbError) {
    throw new Error(`Failed to create conversion record: ${dbError.message}`);
  }
}

export async function updateConversionStatus(
  conversionId: string,
  status: 'completed' | 'failed',
  errorMessage?: string
) {
  const updateData: any = { status };
  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error: updateError } = await supabase
    .from('text_conversions')
    .update(updateData)
    .eq('id', conversionId);

  if (updateError) {
    throw new Error(`Failed to update conversion status: ${updateError.message}`);
  }
}
