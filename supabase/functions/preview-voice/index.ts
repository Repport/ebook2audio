
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
    
    // Parse the request with improved error handling
    let requestData
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { voiceId, previewText } = requestData;

    if (!voiceId) {
      console.error('Missing required parameter: voiceId');
      return new Response(
        JSON.stringify({ error: 'voiceId is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      var { languageCode, ssmlGender } = parseVoiceId(voiceId);
    } catch (parseError) {
      console.error('Failed to parse voice ID:', parseError, 'voiceId:', voiceId);
      return new Response(
        JSON.stringify({ error: 'Invalid voice ID format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
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

    // Get access token
    let accessToken
    try {
      accessToken = await getAccessToken();
      console.log('Successfully obtained access token');
    } catch (tokenError) {
      console.error('Failed to get access token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed: Unable to get access token' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Synthesize speech
    let response
    try {
      response = await synthesizeSpeech(accessToken, requestBody);
    } catch (synthesisError) {
      console.error('Speech synthesis failed:', synthesisError);
      return new Response(
        JSON.stringify({ error: 'Speech synthesis failed: ' + synthesisError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process response
    let data
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse Google API response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse response from speech service' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!data.audioContent) {
      console.error('No audio content in response:', data);
      return new Response(
        JSON.stringify({ error: 'No audio content received from speech service' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Successfully generated audio preview');
    return new Response(
      JSON.stringify({ 
        audioContent: data.audioContent,
        metadata: {
          language: language,
          voiceId: voiceId,
          textLength: textToSpeak.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Preview voice error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
