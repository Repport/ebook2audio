
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAccessToken(credentials: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  if (!credentials || !credentials.client_email || !credentials.private_key) {
    console.error('Invalid credentials:', credentials);
    throw new Error('Invalid Google Cloud credentials configuration');
  }

  const { client_email, private_key } = credentials;

  try {
    console.log('Getting access token for:', client_email);
    const jwt = await create(
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
    console.log('Successfully obtained access token');
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
      headers: corsHeaders,
    });
  }

  try {
    console.log('Request received:', req.method);
    const credentials = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS');
    if (!credentials) {
      console.error('Google Cloud credentials are not configured');
      throw new Error('Google Cloud credentials are missing');
    }

    let parsedCredentials;
    try {
      parsedCredentials = JSON.parse(credentials);
      console.log('Credentials parsed successfully');
    } catch (error) {
      console.error('Failed to parse Google Cloud credentials:', error);
      throw new Error('Invalid Google Cloud credentials format');
    }

    const requestData = await req.json();
    console.log('Request data:', requestData);

    const { voiceId } = requestData;
    if (!voiceId) {
      console.error('No voiceId provided in request data:', requestData);
      throw new Error('voiceId is required');
    }

    console.log('Processing request for voice:', voiceId);

    // Clean and prepare the text
    const PREVIEW_TEXT = "Hello! This is a preview of my voice.";
    const cleanedText = PREVIEW_TEXT.trim();
    if (!cleanedText) {
      throw new Error('No text content to convert');
    }

    const accessToken = await getAccessToken(parsedCredentials);
    console.log('Access token obtained successfully');

    // Extract language code from voiceId (e.g., "en-US" from "en-US-Standard-A")
    const languageCode = voiceId.split('-').slice(0, 2).join('-');
    
    // Determine voice gender based on the last character of voiceId
    const ssmlGender = voiceId.endsWith('C') ? 'FEMALE' : 'MALE';

    // Prepare request to Google Cloud Text-to-Speech API
    const requestBody = {
      input: { text: cleanedText },
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
