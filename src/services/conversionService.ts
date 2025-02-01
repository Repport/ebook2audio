import { supabase } from "@/integrations/supabase/client";

export const convertToAudio = async (text: string, voiceId: string): Promise<ArrayBuffer> => {
  const { data, error } = await supabase.functions.invoke('convert-to-audio', {
    body: { text, voiceId }
  });

  if (error) {
    console.error('Conversion error:', error);
    throw error;
  }

  if (!data?.audioContent) {
    throw new Error('No audio data received');
  }

  // Convert base64 to ArrayBuffer (same as in preview)
  const binaryString = atob(data.audioContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
};