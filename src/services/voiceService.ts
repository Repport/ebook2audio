import { supabase } from "@/integrations/supabase/client";

export interface VoicePreviewResponse {
  audioContent: string;
}

export const previewVoice = async (voiceId: string): Promise<VoicePreviewResponse> => {
  const { data, error } = await supabase.functions.invoke('preview-voice', {
    body: { voiceId }
  });

  if (error) {
    console.error('Voice preview error:', error);
    throw error;
  }

  if (!data?.audioContent) {
    throw new Error('No audio data received');
  }

  return data;
};