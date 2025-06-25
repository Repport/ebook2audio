
import { supabase } from "@/integrations/supabase/client";

export interface VoicePrelistenResponse {
  audioContent: string;
  metadata?: {
    language: string;
    voiceId: string;
    previewText: string;
  };
}

export const prelistenVoice = async (voiceId: string, previewText?: string): Promise<VoicePrelistenResponse> => {
  console.log('Starting voice prelisten request for:', voiceId, 'with preview text:', previewText);
  
  try {
    const { data, error } = await supabase.functions.invoke('preview-voice', {
      body: { 
        voiceId,
        previewText 
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Voice service error: ${error.message || 'Unknown error'}`);
    }

    if (!data) {
      console.error('No data received from voice service');
      throw new Error('No data received from voice service');
    }

    if (data.error) {
      console.error('Voice service returned error:', data.error);
      throw new Error(data.error);
    }

    if (!data.audioContent) {
      console.error('No audio content in response:', data);
      throw new Error('No audio content received from voice service');
    }

    console.log('Voice prelisten completed successfully');
    return data;
    
  } catch (error) {
    console.error('Voice prelisten service error:', error);
    
    // Re-throw with more specific error message
    if (error.message?.includes('billing')) {
      throw new Error('Google Cloud billing not enabled for this project');
    } else if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded, please try again later');
    } else {
      throw error;
    }
  }
};
