
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, fileName, isChunk } = await req.json();
    console.log(`Processing request for ${isChunk ? 'chunk' : 'full text'}, length: ${text.length}`);

    if (!text || !voiceId) {
      throw new Error('Missing required parameters');
    }

    // Initialize Google Cloud TTS client
    const credentials = JSON.parse(Deno.env.get('GCP_SERVICE_ACCOUNT') || '{}');
    
    // Get access token for Google Cloud API
    const tokenResponse = await fetch(
      `https://oauth2.googleapis.com/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: await createJWT(credentials)
        })
      }
    );

    if (!tokenResponse.ok) {
      console.error('Failed to get access token:', await tokenResponse.text());
      throw new Error('Failed to authenticate with Google Cloud');
    }

    const { access_token } = await tokenResponse.json();

    // Call Google Cloud Text-to-Speech API
    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: voiceId.split('-')[0] + '-' + voiceId.split('-')[1],
            name: voiceId,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      console.error('TTS API error:', await ttsResponse.text());
      throw new Error('Text-to-speech conversion failed');
    }

    const { audioContent } = await ttsResponse.json();

    console.log('Successfully generated audio content');
    
    return new Response(
      JSON.stringify({ data: { audioContent } }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in convert-to-audio function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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

// Helper function to create JWT for Google Cloud authentication
async function createJWT(credentials: any) {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: credentials.private_key_id
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedClaim = btoa(JSON.stringify(claim));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  // Create signature
  const encoder = new TextEncoder();
  const keyData = credentials.private_key;
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    new Uint8Array(keyData.split('').map(c => c.charCodeAt(0))),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${signatureInput}.${encodedSignature}`;
}
