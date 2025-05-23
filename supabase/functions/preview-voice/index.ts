
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PREVIEW_TEXTS = {
  english: "Hello! This is a preview of my voice.",
  spanish: "¡Hola! Este es un adelanto de mi voz.",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { voiceId, previewText } = await req.json();

    if (!voiceId) {
      throw new Error('voiceId is required');
    }

    // Determine the language from the voiceId (e.g., "es-US-Standard-A" -> "spanish")
    const languageCode = voiceId.split('-')[0];
    const language = languageCode === 'es' ? 'spanish' : 'english';

    // Use provided preview text or fallback to language-specific default
    const textToSpeak = previewText || PREVIEW_TEXTS[language];
    
    // Get access token
    const accessToken = await getAccessToken();
    
    // Call the Google TTS API
    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text: textToSpeak },
          voice: {
            languageCode: voiceId.split('-').slice(0, 2).join('-'),
            name: voiceId,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Speech synthesis failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }

    return new Response(
      JSON.stringify({ 
        audioContent: data.audioContent,
        metadata: {
          language,
          voiceId,
          previewText: textToSpeak
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
