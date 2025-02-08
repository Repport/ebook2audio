
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

async function getAccessToken(): Promise<string> {
  try {
    const credentials = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS');
    if (!credentials) {
      throw new Error('Google Cloud credentials are missing');
    }

    const parsedCredentials = JSON.parse(credentials);
    if (!parsedCredentials.client_email || !parsedCredentials.private_key) {
      throw new Error('Invalid credentials format');
    }

    // First decode the private key and remove any wrapping quotes
    const privateKey = parsedCredentials.private_key
      .replace(/\\n/g, '\n')
      .replace(/^"|"$/g, '');

    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: parsedCredentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Prepare the JWT header
    const header = { 
      alg: 'RS256', 
      typ: 'JWT' 
    };

    // Base64url encode the header and payload
    const encodeBase64Url = (input: string): string => {
      return btoa(input)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    };

    const encodedHeader = encodeBase64Url(JSON.stringify(header));
    const encodedPayload = encodeBase64Url(JSON.stringify(payload));

    // Create the signing input
    const signInput = `${encodedHeader}.${encodedPayload}`;

    // Convert PEM key to ArrayBuffer
    const binaryKey = new TextEncoder().encode(privateKey);

    try {
      // Import the private key
      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryKey,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      );

      // Sign the input
      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        new TextEncoder().encode(signInput)
      );

      // Convert the signature to base64url
      const encodedSignature = encodeBase64Url(
        String.fromCharCode(...new Uint8Array(signature))
      );

      // Create the complete JWT
      const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

      // Exchange JWT for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('Token request failed:', error);
        throw new Error('Failed to get access token');
      }

      const { access_token } = await tokenResponse.json();
      console.log('Successfully obtained access token');
      return access_token;

    } catch (error) {
      console.error('Error during key operations:', error);
      throw new Error(`Key operation failed: ${error.message}`);
    }

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

