
import { supabase } from "@/integrations/supabase/client";
import { Chapter } from "@/utils/textExtraction";

interface ChapterWithTimestamp extends Chapter {
  timestamp: number;
}

// Simple XOR-based obfuscation
function obfuscateData(data: string): string {
  const key = 'epub2audio';
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// Generate hash for text content using Web Crypto API
async function generateHash(text: string, voiceId: string): Promise<string> {
  const data = `${text}-${voiceId}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export const convertToAudio = async (
  text: string, 
  voiceId: string,
  chapters?: ChapterWithTimestamp[],
  fileName?: string
): Promise<ArrayBuffer> => {
  if (text.startsWith('%PDF')) {
    console.error('Received raw PDF data instead of text content');
    throw new Error('Invalid text content: Raw PDF data received. Please check PDF text extraction.');
  }

  console.log('Converting text length:', text.length, 'with voice:', voiceId);
  console.log('Chapters:', chapters?.length || 0);

  // Generate hash for the text and voice combination
  const textHash = await generateHash(text, voiceId);

  // Check if we have a cached version
  const { data: existingConversion } = await supabase
    .from('text_conversions')
    .select('*')
    .eq('text_hash', textHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existingConversion?.storage_path) {
    console.log('Found cached conversion, fetching from storage');
    const { data: audioData, error: downloadError } = await supabase.storage
      .from('audio_cache')
      .download(existingConversion.storage_path);

    if (downloadError) {
      console.error('Error downloading cached audio:', downloadError);
      throw downloadError;
    }

    return await audioData.arrayBuffer();
  }

  // Obfuscate sensitive data before sending
  const obfuscatedText = obfuscateData(text);
  const obfuscatedVoiceId = obfuscateData(voiceId);

  const { data, error } = await supabase.functions.invoke('convert-to-audio', {
    body: { 
      text: obfuscatedText, 
      voiceId: obfuscatedVoiceId,
      fileName,
      chapters: chapters?.map(ch => ({
        title: ch.title,
        timestamp: ch.timestamp
      }))
    }
  });

  if (error) {
    if (error.message.includes('rate limit exceeded')) {
      throw new Error('You have exceeded the maximum number of conversions allowed in 24 hours. Please try again later.');
    }
    console.error('Conversion error:', error);
    throw error;
  }

  if (!data?.audioContent) {
    throw new Error('No audio data received');
  }

  // Convert base64 to Uint8Array for storage
  const binaryString = atob(data.audioContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Generate a unique filename for storage
  const storagePath = `${textHash}.mp3`;

  // Upload to storage bucket
  const { error: uploadError } = await supabase.storage
    .from('audio_cache')
    .upload(storagePath, bytes.buffer, {
      contentType: 'audio/mpeg',
      upsert: true // Override if exists
    });

  if (uploadError) {
    console.error('Error uploading to storage:', uploadError);
    throw uploadError;
  }

  // Store the conversion record in the database
  const { error: insertError } = await supabase
    .from('text_conversions')
    .insert({
      text_hash: textHash,
      storage_path: storagePath,
      file_name: fileName,
      file_size: bytes.length,
      duration: data.duration || null
    });

  if (insertError) {
    console.error('Error storing conversion:', insertError);
    // Don't throw here as the file is already in storage
  }
  
  return bytes.buffer;
};
