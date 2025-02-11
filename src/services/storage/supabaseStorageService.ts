
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';

interface CachedAudio {
  data: string;
  timestamp: number;
  format: string;
}

const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export const saveToSupabase = async (
  audio: ArrayBuffer,
  extractedText: string,
  duration: number,
  fileName: string,
  userId: string
) => {
  try {
    // Generate a unique file path for storage
    const storagePath = `${userId}/${crypto.randomUUID()}.mp3`;
    
    // Compress the audio if it's larger than 10MB
    let finalAudio = audio;
    let finalPath = storagePath;
    let contentType = 'audio/mpeg';
    
    if (audio.byteLength > 10 * 1024 * 1024) {
      const zip = new JSZip();
      zip.file('audio.mp3', audio);
      finalAudio = await zip.generateAsync({ type: 'arraybuffer' });
      finalPath = storagePath + '.zip';
      contentType = 'application/zip';
    }
    
    console.log('Uploading file with content type:', contentType);
    
    // Upload the audio file to storage
    const { error: uploadError } = await supabase.storage
      .from('audio_cache')
      .upload(finalPath, finalAudio, {
        contentType: contentType,
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
        storage_path: finalPath,
        file_size: finalAudio.byteLength,
        duration: Math.round(duration),
        user_id: userId,
        text_hash: textHash,
        status: 'completed'
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      throw dbError;
    }

    return finalPath;
  } catch (error) {
    console.error('Error in saveToSupabase:', error);
    throw error;
  }
};

export const fetchFromCache = async (storagePath: string): Promise<ArrayBuffer | null> => {
  try {
    // Check browser cache first
    const cachedData = localStorage.getItem(`audio-${storagePath}`);
    if (cachedData) {
      const cached: CachedAudio = JSON.parse(cachedData);
      if (Date.now() - cached.timestamp < CACHE_EXPIRY) {
        console.log('Serving audio from browser cache');
        const binaryString = atob(cached.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      } else {
        localStorage.removeItem(`audio-${storagePath}`);
      }
    }

    console.log('Fetching from Supabase storage:', storagePath);

    // Fetch from Supabase if not in cache
    const { data, error } = await supabase.storage
      .from('audio_cache')
      .download(storagePath);

    if (error) {
      console.error('Cache fetch error:', error);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();

    // Handle zip files
    if (storagePath.endsWith('.zip')) {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(arrayBuffer);
      const audioFile = zipContent.file('audio.mp3');
      if (!audioFile) {
        throw new Error('No audio file found in zip');
      }
      const unzippedAudio = await audioFile.async('arraybuffer');
      
      // Cache the unzipped audio
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(unzippedAudio)));
      localStorage.setItem(`audio-${storagePath}`, JSON.stringify({
        data: base64Audio,
        timestamp: Date.now(),
        format: 'mp3'
      }));
      
      return unzippedAudio;
    }

    // Cache the audio
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    localStorage.setItem(`audio-${storagePath}`, JSON.stringify({
      data: base64Audio,
      timestamp: Date.now(),
      format: 'mp3'
    }));

    return arrayBuffer;
  } catch (error) {
    console.error('Error in fetchFromCache:', error);
    return null;
  }
};
