
import { supabase } from "@/integrations/supabase/client";

export interface VoicePrelistenResponse {
  audioContent: string;
}

export const prelistenVoice = async (voiceId: string, previewText?: string): Promise<VoicePrelistenResponse> => {
  console.log('Starting voice prelisten request for:', voiceId, 'with preview text:', previewText);
  
  const { data, error } = await supabase.functions.invoke('preview-voice', {
    body: { 
      voiceId,
      previewText 
    }
  });

  if (error) {
    console.error('Voice prelisten error:', error);
    throw error;
  }

  if (!data?.audioContent) {
    console.error('No audio content received:', data);
    throw new Error('No audio data received');
  }

  console.log('Voice prelisten data received successfully');
  return data;
};
