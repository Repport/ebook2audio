
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getAccessToken } from "./auth.ts"
import { 
  TextToSpeechRequest, 
  parseVoiceId, 
  synthesizeSpeech 
} from "./speech.ts"

const PREVIEW_TEXT = "Hello! This is a preview of my voice.";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing voice preview request');
    const { voiceId } = await req.json();

    if (!voiceId) {
      throw new Error('voiceId is required');
    }

    const { languageCode, ssmlGender } = parseVoiceId(voiceId);
    
    const requestBody: TextToSpeechRequest = {
      input: { text: PREVIEW_TEXT.trim() },
      voice: {
        languageCode,
        name: voiceId,
        ssmlGender
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
      }
    };

    const accessToken = await getAccessToken();
    const response = await synthesizeSpeech(accessToken, requestBody);
    const data = await response.json();

    return new Response(
      JSON.stringify({ audioContent: data.audioContent }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Preview voice error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
