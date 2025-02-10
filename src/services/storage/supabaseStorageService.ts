
import { supabase } from '@/integrations/supabase/client';
import { splitAudioIntoChunks, uploadAudioChunk, checkAllChunksUploaded, combineChunks } from './audioChunkService';
import { compressToZip } from './compressionService';

export const saveToSupabase = async (
  audio: ArrayBuffer,
  extractedText: string,
  duration: number,
  fileName: string,
  userId: string
) => {
  // Generate a unique conversion ID
  const conversionId = crypto.randomUUID();
  const storagePath = `${conversionId}/final.m4a`;
  
  try {
    // Compress the audio file
    const { compressedData, compressionRatio } = await compressToZip(audio);
    const compressedStoragePath = `${conversionId}/compressed.zip`;
    
    // Create the conversion record first
    const { error: dbError } = await supabase
      .from('text_conversions')
      .insert({
        id: conversionId,
        file_name: fileName.replace('.mp3', '.m4a'),
        file_size: audio.byteLength,
        compressed_size: compressedData.length,
        compression_ratio: compressionRatio,
        duration: Math.round(duration),
        user_id: userId,
        text_hash: btoa(extractedText.slice(0, 100)).slice(0, 32),
        status: 'processing',
        storage_path: storagePath,
        compressed_storage_path: compressedStoragePath
      });

    if (dbError) throw dbError;

    // Upload compressed file
    const { error: uploadError } = await supabase.storage
      .from('audio_cache')
      .upload(compressedStoragePath, compressedData, {
        contentType: 'application/zip',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Split audio into chunks and upload them
    const chunks = await splitAudioIntoChunks(audio);
    console.log(`Split audio into ${chunks.length} chunks`);

    // Upload chunks in parallel with a concurrency limit
    const MAX_CONCURRENT_UPLOADS = 3;
    const chunkGroups = [];
    for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_UPLOADS) {
      const group = chunks.slice(i, i + MAX_CONCURRENT_UPLOADS);
      const uploadPromises = group.map(chunk => uploadAudioChunk(conversionId, chunk));
      const results = await Promise.all(uploadPromises);
      
      // Check for any upload failures
      const failedUploads = results.filter(r => !r.success);
      if (failedUploads.length > 0) {
        throw new Error(`Failed to upload ${failedUploads.length} chunks`);
      }
    }

    // Verify all chunks were uploaded
    const allUploaded = await checkAllChunksUploaded(conversionId);
    if (!allUploaded) {
      throw new Error('Not all chunks were uploaded successfully');
    }

    // Combine chunks into final file
    const finalAudio = await combineChunks(conversionId);
    if (!finalAudio) {
      throw new Error('Failed to combine audio chunks');
    }

    // Update conversion record as completed
    const { error: updateError } = await supabase
      .from('text_conversions')
      .update({
        status: 'completed'
      })
      .eq('id', conversionId);

    if (updateError) throw updateError;

    return conversionId;
  } catch (error) {
    console.error('Error in saveToSupabase:', error);
    
    // Clean up any uploaded chunks and the conversion record
    if (error instanceof Error) {
      await supabase
        .from('text_conversions')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', conversionId);
    }
    
    throw error;
  }
};
