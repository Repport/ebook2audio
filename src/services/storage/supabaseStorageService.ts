
import { supabase } from '@/integrations/supabase/client';
import { splitAudioIntoChunks, uploadAudioChunk, checkAllChunksUploaded, combineChunks } from './audioChunkService';
import { compressToZip } from './compressionService';
import { logStorageOperation } from './logService';
import { testStorageConnection } from './testService';
import { createConversionRecord, updateConversionStatus } from './conversionRecordService';

export { testStorageConnection };

export const saveToSupabase = async (
  audio: ArrayBuffer,
  extractedText: string,
  duration: number,
  fileName: string,
  userId: string
) => {
  const conversionId = crypto.randomUUID();
  const storagePath = `${conversionId}/final.m4a`;
  const compressedStoragePath = `${conversionId}/compressed.zip`;

  try {
    // Test storage connection first
    const isStorageWorking = await testStorageConnection();
    if (!isStorageWorking) {
      throw new Error('Storage connection test failed');
    }

    // Start logging the conversion
    await logStorageOperation(
      'start_conversion',
      storagePath,
      'started',
      null,
      audio.byteLength,
      'audio/mp4',
      conversionId
    );

    // Compress the audio file
    const { compressedData, compressionRatio } = await compressToZip(audio);
    
    // Create the conversion record
    await createConversionRecord(
      conversionId,
      fileName,
      audio.byteLength,
      compressedData.length,
      compressionRatio,
      duration,
      userId,
      extractedText,
      storagePath,
      compressedStoragePath
    );

    // Upload compressed file
    await logStorageOperation(
      'upload_compressed',
      compressedStoragePath,
      'started',
      null,
      compressedData.length,
      'application/zip',
      conversionId
    );

    const { error: uploadError } = await supabase.storage
      .from('audio_cache')
      .upload(compressedStoragePath, compressedData, {
        contentType: 'application/zip',
        upsert: true
      });

    if (uploadError) {
      await logStorageOperation('upload_compressed', compressedStoragePath, 'failed', uploadError, null, null, conversionId);
      throw new Error(`Failed to upload compressed file: ${uploadError.message}`);
    }

    await logStorageOperation('upload_compressed', compressedStoragePath, 'completed', null, compressedData.length, 'application/zip', conversionId);

    // Split and upload chunks
    const chunks = await splitAudioIntoChunks(audio);
    console.log(`Split audio into ${chunks.length} chunks`);

    await logStorageOperation('upload_chunks', null, 'started', null, null, null, conversionId);

    const MAX_CONCURRENT_UPLOADS = 3;
    for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_UPLOADS) {
      const group = chunks.slice(i, i + MAX_CONCURRENT_UPLOADS);
      const uploadPromises = group.map(chunk => uploadAudioChunk(conversionId, chunk));
      const results = await Promise.all(uploadPromises);
      
      const failedUploads = results.filter(r => !r.success);
      if (failedUploads.length > 0) {
        await logStorageOperation('upload_chunks', null, 'failed', new Error(`Failed to upload ${failedUploads.length} chunks`), null, null, conversionId);
        throw new Error(`Failed to upload ${failedUploads.length} chunks`);
      }
    }

    // Verify chunks
    const allUploaded = await checkAllChunksUploaded(conversionId);
    if (!allUploaded) {
      await logStorageOperation('verify_chunks', null, 'failed', new Error('Not all chunks were uploaded'), null, null, conversionId);
      throw new Error('Not all chunks were uploaded successfully');
    }

    await logStorageOperation('upload_chunks', null, 'completed', null, null, null, conversionId);

    // Combine chunks
    const finalAudio = await combineChunks(conversionId);
    if (!finalAudio) {
      await logStorageOperation('combine_chunks', null, 'failed', new Error('Failed to combine chunks'), null, null, conversionId);
      throw new Error('Failed to combine audio chunks');
    }

    // Upload final audio
    await logStorageOperation('upload_final', storagePath, 'started', null, finalAudio.byteLength, 'audio/mp4', conversionId);

    const { error: finalUploadError } = await supabase.storage
      .from('audio_cache')
      .upload(storagePath, finalAudio, {
        contentType: 'audio/mp4',
        upsert: true
      });

    if (finalUploadError) {
      await logStorageOperation('upload_final', storagePath, 'failed', finalUploadError, null, null, conversionId);
      throw new Error(`Failed to upload final audio: ${finalUploadError.message}`);
    }

    await logStorageOperation('upload_final', storagePath, 'completed', null, finalAudio.byteLength, 'audio/mp4', conversionId);

    // Update conversion status
    await updateConversionStatus(conversionId, 'completed');
    await logStorageOperation('conversion_complete', null, 'completed', null, null, null, conversionId);
    
    return conversionId;

  } catch (error) {
    console.error('Error in saveToSupabase:', error);
    
    if (error instanceof Error) {
      await updateConversionStatus(conversionId, 'failed', error.message);
    }
    
    throw error;
  }
};
