
import { supabase } from "@/integrations/supabase/client";
import { Chapter } from "@/utils/textExtraction";

interface ChapterWithTimestamp extends Chapter {
  timestamp: number;
}

// Improved XOR-based obfuscation with better key rotation
function obfuscateData(data: string): string {
  const key = 'epub2audio' + new Date().getUTCDate();
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

async function generateTextHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const validateInput = (text: string, voiceId: string): void => {
  if (!text?.trim()) {
    throw new Error('Text content is required');
  }

  if (!voiceId?.trim()) {
    throw new Error('Voice ID is required');
  }

  if (text.startsWith('%PDF')) {
    throw new Error('Invalid text content: Raw PDF data received');
  }
};

const checkExistingConversion = async (textHash: string): Promise<ArrayBuffer | null> => {
  const { data: existingConversion, error } = await supabase
    .from('text_conversions')
    .select('audio_content')
    .eq('text_hash', textHash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !existingConversion?.audio_content) {
    return null;
  }

  // Convert base64 to ArrayBuffer
  const binaryString = atob(existingConversion.audio_content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
};

const storeConversion = async (
  textHash: string,
  audioContent: ArrayBuffer,
  fileName: string,
  duration: number
) => {
  // Convert ArrayBuffer to base64 string for storage
  const uint8Array = new Uint8Array(audioContent);
  const binaryString = String.fromCharCode.apply(null, Array.from(uint8Array));
  const base64String = btoa(binaryString);

  const { error } = await supabase
    .from('text_conversions')
    .insert({
      text_hash: textHash,
      file_name: fileName,
      audio_content: base64String,
      file_size: audioContent.byteLength,
      duration: duration
    });

  if (error) {
    console.error('Error storing conversion:', error);
  }
};

export const convertToAudio = async (
  text: string, 
  voiceId: string,
  chapters?: ChapterWithTimestamp[],
  fileName?: string
): Promise<ArrayBuffer> => {
  console.log('Starting conversion:', {
    textLength: text.length,
    voiceId,
    chaptersCount: chapters?.length || 0,
    fileName
  });

  validateInput(text, voiceId);
  const textHash = await generateTextHash(text);

  // Check for existing conversion
  const existingAudio = await checkExistingConversion(textHash);
  if (existingAudio) {
    console.log('Found existing conversion, returning cached audio');
    return existingAudio;
  }

  try {
    const obfuscatedText = obfuscateData(text);
    const obfuscatedVoiceId = obfuscateData(voiceId);

    const { data, error } = await supabase.functions.invoke('convert-to-audio', {
      body: { 
        text: obfuscatedText, 
        voiceId: obfuscatedVoiceId,
        fileName: fileName || 'untitled',
        chapters: chapters?.map(ch => ({
          title: ch.title,
          timestamp: ch.timestamp
        }))
      }
    });

    if (error) {
      if (error.message.includes('rate limit exceeded')) {
        throw new Error('Conversion rate limit exceeded. Please try again later.');
      }
      console.error('Conversion error:', error);
      throw error;
    }

    if (!data?.audioContent) {
      throw new Error('No audio data received from conversion service');
    }

    // Convert base64 to ArrayBuffer
    const binaryString = atob(data.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const audioBuffer = bytes.buffer;

    // Store the conversion for future use
    await storeConversion(textHash, audioBuffer, fileName || 'untitled', data.duration || 0);
    
    console.log('Conversion completed successfully');
    return audioBuffer;
  } catch (error) {
    console.error('Conversion failed:', error);
    throw error;
  }
};
