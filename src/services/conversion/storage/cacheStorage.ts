
import { supabase } from "@/integrations/supabase/client";
import { CacheError } from '../errors/CacheError';
import { retryOperation } from '../utils/retryUtils';
import JSZip from 'jszip';

const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export async function downloadFromStorage(
  storagePath: string
): Promise<{ data: ArrayBuffer | null; error: Error | null }> {
  try {
    console.log('Fetching from cache storage path:', storagePath);
    
    const result = await retryOperation(
      async () => {
        const { data, error } = await supabase.storage
          .from('audio_cache')
          .download(storagePath);
        
        if (error) throw error;
        return { data, error: null };
      },
      { operation: 'Cache fetch' }
    );

    if (!result.data) {
      console.error('No data found in cache');
      return { data: null, error: new Error('No data found in cache') };
    }

    const arrayBuffer = await result.data.arrayBuffer();

    // If it's a zip file, extract the audio
    if (storagePath.endsWith('.zip')) {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(arrayBuffer);
      const audioFile = zipContent.file('audio.mp3');
      if (!audioFile) {
        throw new Error('No audio file found in zip');
      }
      const unzippedAudio = await audioFile.async('arraybuffer');
      return { data: unzippedAudio, error: null };
    }

    return { data: arrayBuffer, error: null };
  } catch (error) {
    console.error('Cache fetch failed:', error);
    return { data: null, error: error as Error };
  }
}

export async function uploadToStorage(
  storagePath: string,
  audioBuffer: ArrayBuffer
): Promise<{ error: Error | null }> {
  try {
    // If file is larger than 5MB, compress it
    if (audioBuffer.byteLength > MAX_CHUNK_SIZE) {
      console.log('File is large, compressing...');
      const zip = new JSZip();
      zip.file('audio.mp3', audioBuffer);
      const compressedData = await zip.generateAsync({
        type: 'arraybuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const zipPath = storagePath + '.zip';
      console.log('Uploading compressed file:', zipPath);

      const { error: uploadError } = await supabase.storage
        .from('audio_cache')
        .upload(zipPath, compressedData, {
          contentType: 'application/zip',
          upsert: true
        });

      if (uploadError) {
        console.error('Compressed upload failed:', uploadError);
        throw uploadError;
      }

      return { error: null };
    }

    // For smaller files, upload directly
    console.log('Uploading uncompressed file:', storagePath);
    const { error: uploadError } = await supabase.storage
      .from('audio_cache')
      .upload(storagePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Direct upload failed:', uploadError);
      throw uploadError;
    }

    return { error: null };
  } catch (error) {
    console.error('Storage upload failed:', error);
    return { error: error as Error };
  }
}
