
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    if (!voiceId) {
      throw new Error('Voice ID is required');
    }

    // Initialize Google Cloud TTS client
    const accessToken = await getAccessToken();

    // Determine the language code from the voice ID (e.g., "es-US-Standard-A" -> "es-US")
    const languageCode = voiceId.split('-').slice(0, 2).join('-');
    
    // Prepare the request body
    const requestBody = {
      input: { text },
      voice: {
        languageCode,
        name: voiceId,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
      }
    };

    // Call the Google TTS API
    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
      JSON.stringify({ 
        audioContent: result.audioContent,
        metadata: {
          language: languageCode,
          voiceId: voiceId,
          textLength: text.length,
          processingTime: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Text-to-speech error:', error);
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

/**
 * Gets an access token for Google Cloud APIs
 */
async function getAccessToken(): Promise<string> {
  try {
    // Get the service account key from the environment
    const serviceAccountKey = Deno.env.get('GCP_SERVICE_ACCOUNT');
    
    if (!serviceAccountKey) {
      throw new Error('GCP_SERVICE_ACCOUNT environment variable is not set');
    }
    
    // Parse the service account key
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    // Create a JWT token
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1 hour
    
    const jwtHeader = {
      alg: 'RS256',
      typ: 'JWT',
      kid: serviceAccount.private_key_id
    };
    
    const jwtPayload = {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: expiry,
      scope: 'https://www.googleapis.com/auth/cloud-platform'
    };
    
    const headerBase64 = btoa(JSON.stringify(jwtHeader));
    const payloadBase64 = btoa(JSON.stringify(jwtPayload));
    const signatureInput = `${headerBase64}.${payloadBase64}`;
    
    // Sign the JWT
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureInput);
    
    const privateKey = serviceAccount.private_key;
    const keyAlgorithm = { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } };
    
    const importedKey = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(privateKey),
      keyAlgorithm,
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      keyAlgorithm,
      importedKey,
      data
    );
    
    const signatureBase64 = arrayBufferToBase64(signature);
    const jwt = `${headerBase64}.${payloadBase64}.${signatureBase64}`;
    
    // Exchange the JWT for an access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${tokenResponse.status} ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

/**
 * Converts a PEM format private key to an ArrayBuffer
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  // Remove PEM header and footer and newlines, then decode
  const base64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
    
  return base64ToArrayBuffer(base64);
}

/**
 * Converts a base64 string to an ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Converts an ArrayBuffer to a base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}
