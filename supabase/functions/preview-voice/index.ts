
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getAccessToken } from "./auth.ts"
import { 
  TextToSpeechRequest, 
  parseVoiceId, 
  synthesizeSpeech 
} from "./speech.ts"

const PREVIEW_TEXTS = {
  english: "Hello! This is a preview of my voice.",
  spanish: "¡Hola! Este es un adelanto de mi voz.",
  french: "Bonjour! Ceci est un aperçu de ma voix.",
  german: "Hallo! Dies ist eine Vorschau meiner Stimme.",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing voice preview request');
    const { voiceId, previewText } = await req.json();

    if (!voiceId) {
      throw new Error('voiceId is required');
    }

    const { languageCode, ssmlGender } = parseVoiceId(voiceId);
    
    // Determine the language from the voiceId (e.g., "es-US-Standard-A" -> "spanish")
    const language = languageCode.startsWith('es') ? 'spanish' :
                    languageCode.startsWith('fr') ? 'french' :
                    languageCode.startsWith('de') ? 'german' :
                    'english';

    // Use provided preview text or fallback to language-specific default
    const textToSpeak = previewText?.trim() || PREVIEW_TEXTS[language];
    console.log('Using preview text:', textToSpeak, 'for language:', language);
    
    const requestBody: TextToSpeechRequest = {
      input: { text: textToSpeak },
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

    if (!data.audioContent) {
      console.error('No audio content in response:', data);
      throw new Error('No audio content received from speech service');
    }

    console.log('Successfully generated audio preview');
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
