
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleCloudCredentials {
  client_email: string;
  private_key: string;
}

interface TextToSpeechRequest {
  input: {
    text: string;
  };
  voice: {
    languageCode: string;
    name: string;
    ssmlGender: string;
  };
  audioConfig: {
    audioEncoding: string;
    speakingRate: number;
    pitch: number;
  };
}

const PREVIEW_TEXT = "Hello! This is a preview of my voice.";

async function getAccessToken(credentials: GoogleCloudCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  if (!credentials?.client_email || !credentials?.private_key) {
    console.error('Invalid credentials provided:', { 
      hasEmail: !!credentials?.client_email, 
      hasKey: !!credentials?.private_key 
    });
    throw new Error('Invalid Google Cloud credentials configuration');
  }

  try {
    console.log('Getting access token for:', credentials.client_email);
    const jwt = await create(
      { alg: "RS256", typ: "JWT" },
      {
        iss: credentials.client_email,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      },
      credentials.private_key
    );

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token request failed:', error);
      throw new Error('Failed to get access token');
    }

    const { access_token } = await response.json();
    console.log('Successfully obtained access token');
    return access_token;
  } catch (error) {
    console.error('Error in getAccessToken:', error);
    throw error;
  }
}

async function synthesizeSpeech(accessToken: string, requestBody: TextToSpeechRequest): Promise<Response> {
  const response = await fetch(
    'https://texttospeech.googleapis.com/v1/text:synthesize',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Cloud API error:', {
      status: response.status,
      error: errorText
    });
    throw new Error(`Google Cloud API failed: ${response.status} ${response.statusText}`);
  }

  return response;
}

function parseVoiceId(voiceId: string): { languageCode: string; ssmlGender: string } {
  const languageCode = voiceId.split('-').slice(0, 2).join('-');
  const ssmlGender = voiceId.endsWith('C') ? 'FEMALE' : 'MALE';
  return { languageCode, ssmlGender };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing voice preview request');
    const credentials = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS');
    
    if (!credentials) {
      throw new Error('Google Cloud credentials are missing');
    }

    const parsedCredentials = JSON.parse(credentials);
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

    const accessToken = await getAccessToken(parsedCredentials);
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
