
import { supabase } from "@/integrations/supabase/client";

export interface VoicePreviewResponse {
  audioContent: string;
}

export const previewVoice = async (voiceId: string, previewText?: string): Promise<VoicePreviewResponse> => {
  console.log('Starting voice preview request for:', voiceId);
  
  const { data, error } = await supabase.functions.invoke('preview-voice', {
    body: { 
      voiceId,
      previewText 
    }
  });

  if (error) {
    console.error('Voice preview error:', error);
    throw error;
  }

  if (!data?.audioContent) {
    console.error('No audio content received:', data);
    throw new Error('No audio data received');
  }

  console.log('Voice preview data received successfully');
  return data;
};
