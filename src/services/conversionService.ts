
import { supabase } from "@/integrations/supabase/client";
import { Chapter } from "@/utils/textExtraction";

interface ChapterWithTimestamp extends Chapter {
  timestamp: number;
}

export const convertToAudio = async (
  text: string, 
  voiceId: string,
  chapters?: ChapterWithTimestamp[]
): Promise<ArrayBuffer> => {
  if (text.startsWith('%PDF')) {
    console.error('Received raw PDF data instead of text content');
    throw new Error('Invalid text content: Raw PDF data received. Please check PDF text extraction.');
  }

  console.log('Converting text length:', text.length, 'with voice:', voiceId);
  console.log('Chapters:', chapters?.length || 0);

  const { data, error } = await supabase.functions.invoke('convert-to-audio', {
    body: { 
      text, 
      voiceId,
      chapters: chapters?.map(ch => ({
        title: ch.title,
        timestamp: ch.timestamp
      }))
    }
  });

  if (error) {
    console.error('Conversion error:', error);
    throw error;
  }

  if (!data?.audioContent) {
    throw new Error('No audio data received');
  }

  // Convert base64 to ArrayBuffer
  const binaryString = atob(data.audioContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
};
