
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config/constants.ts';

console.log('Loading convert-to-audio function...');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    console.log('🚀 Starting text-to-speech conversion request');
    
    let body;
    try {
      body = await req.json();
      console.log('📝 Request parsed:', {
        textLength: body.text?.length,
        voiceId: body.voiceId,
        fileName: body.fileName,
        conversionId: body.conversionId
      });
    } catch (e) {
      console.error('❌ Failed to parse request body:', e);
      throw new Error(`Invalid request body: ${e.message}`);
    }

    const { text, voiceId, conversionId } = body;

    // Basic validations
    if (!text || typeof text !== 'string') {
      throw new Error('Text parameter must be a non-empty string');
    }

    if (!voiceId || typeof voiceId !== 'string') {
      throw new Error('VoiceId parameter must be a non-empty string');
    }

    if (!conversionId) {
      throw new Error('conversionId parameter is required');
    }

    // Extract language code from voiceId (e.g., "en-US-Standard-C" -> "en-US")
    const langCode = voiceId.split('-').slice(0, 2).join('-');
    console.log(`Using language code: ${langCode}`);

    // Get access token
    const googleAccessToken = await getGoogleAccessToken();
    console.log('🔑 Successfully obtained access token');

    // Prepare request body for Google TTS API
    const requestBody = {
      input: { text },
      voice: {
        languageCode: langCode,
        name: voiceId,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
        sampleRateHertz: 24000,
      },
    };

    console.log('Sending request to Google TTS API');

    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google TTS API error:', errorText);
      throw new Error(`Speech synthesis failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }

    return new Response(
      JSON.stringify({ audioContent: result.audioContent }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('❌ Error in convert-to-audio function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});

async function getGoogleAccessToken(): Promise<string> {
  try {
    const credentialsString = Deno.env.get('GCP_SERVICE_ACCOUNT');
    if (!credentialsString) {
      throw new Error('GCP credentials missing');
    }

    const credentials = JSON.parse(atob(credentialsString));
    
    // Create JWT assertion
    const now = Math.floor(Date.now() / 1000);
    const jwt = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const encoder = new TextEncoder();
    const jwtHeader = encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const jwtPayload = encoder.encode(JSON.stringify(jwt));

    const base64url = (buffer: Uint8Array) =>
      btoa(String.fromCharCode(...buffer))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const assertion = `${base64url(jwtHeader)}.${base64url(jwtPayload)}`;

    const tokenResponse = await fetch(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion,
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${await tokenResponse.text()}`);
    }

    const { access_token } = await tokenResponse.json();
    if (!access_token) {
      throw new Error('No access token received');
    }

    return access_token;
  } catch (error) {
    console.error('Error getting Google access token:', error);
    throw error;
  }
}
