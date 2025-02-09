
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

  try {
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
    
    console.log('Conversion completed successfully');
    return bytes.buffer;
  } catch (error) {
    console.error('Conversion failed:', error);
    throw error;
  }
};
