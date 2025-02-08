
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { create as createJWT } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAccessToken(credentials: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const client_email = credentials.client_email;
  const private_key = credentials.private_key;

  try {
    // Create JWT
    const jwt = await createJWT(
      { alg: "RS256", typ: "JWT" },
      {
        iss: client_email,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      },
      private_key
    );

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
      console.error('Failed to get access token:', error);
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenResponse.json();
    return access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  try {
    console.log('Request received:', req.method);
    const credentials = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS');
    if (!credentials) {
      console.error('Google Cloud credentials are not configured');
      throw new Error('Google Cloud credentials are missing');
    }

    const parsedCredentials = JSON.parse(credentials);
    console.log('Credentials parsed successfully');

    const { voiceId } = await req.json();
    if (!voiceId) {
      throw new Error('Voice ID is required');
    }
    console.log('Previewing voice:', voiceId);

    const accessToken = await getAccessToken(parsedCredentials);
    console.log('Access token obtained successfully');

    // Clean and prepare the text
    const PREVIEW_TEXT = "Hello! This is a preview of my voice.";
    const cleanedText = PREVIEW_TEXT.trim();
    if (!cleanedText) {
      throw new Error('No text content to convert');
    }

    // Determine voice gender based on voice ID
    const ssmlGender = voiceId.includes('Standard-C') ? 'FEMALE' : 'MALE';

    // Prepare request to Google Cloud Text-to-Speech API
    const requestBody = {
      input: { text: cleanedText },
      voice: {
        languageCode: 'en-US',
        name: voiceId,
        ssmlGender
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
      }
    };

    console.log('Making request to Google Cloud Text-to-Speech API with body:', JSON.stringify(requestBody));
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
      console.error('Google Cloud API failed with status:', response.status);
      console.error('Error response:', errorText);
      throw new Error(`Google Cloud API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully received response from Google Cloud API');

    return new Response(
      JSON.stringify({ audioContent: data.audioContent }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error('Preview voice error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
});
