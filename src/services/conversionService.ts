
import { supabase } from "@/integrations/supabase/client";
import { Chapter } from "@/utils/textExtraction";
import { createHash } from 'crypto';

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

// Generate hash for text content
function generateHash(text: string, voiceId: string): string {
  const data = `${text}-${voiceId}`;
  return createHash('sha256').update(data).digest('hex');
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
  const textHash = generateHash(text, voiceId);

  // Check if we have a cached version
  const { data: existingConversion } = await supabase
    .from('text_conversions')
    .select('*')
    .eq('text_hash', textHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existingConversion?.audio_content) {
    console.log('Found cached conversion, returning existing audio');
    // Convert base64 to ArrayBuffer
    const binaryString = atob(existingConversion.audio_content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
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

  // Store the conversion in the database
  const { error: insertError } = await supabase
    .from('text_conversions')
    .insert({
      text_hash: textHash,
      audio_content: data.audioContent,
      file_name: fileName,
      file_size: data.audioContent.length,
      duration: data.duration || null
    });

  if (insertError) {
    console.error('Error storing conversion:', insertError);
  }

  // Convert base64 to ArrayBuffer
  const binaryString = atob(data.audioContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
};
