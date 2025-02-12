
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { processTextInChunks, combineAudioChunks } from './chunkProcessor.ts'

console.log('Loading convert-to-audio function...')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  try {
    console.log('Starting text-to-speech conversion request')
    
    // Parse request body
    let body
    try {
      body = await req.json()
      console.log('Request body received:', {
        textLength: body.text?.length,
        voiceId: body.voiceId,
        fileName: body.fileName
      })
    } catch (e) {
      console.error('Failed to parse request body:', e)
      throw new Error('Invalid request body')
    }

    const { text, voiceId, fileName } = body

    if (!text || typeof text !== 'string') {
      console.error('Missing or invalid text parameter:', { text })
      throw new Error('Text parameter must be a non-empty string')
    }

    if (!voiceId || typeof voiceId !== 'string') {
      console.error('Missing or invalid voiceId parameter:', { voiceId })
      throw new Error('VoiceId parameter must be a non-empty string')
    }

    // Initialize Google Cloud TTS client
    const credentialsString = Deno.env.get('GCP_SERVICE_ACCOUNT')
    if (!credentialsString) {
      console.error('GCP credentials not found')
      throw new Error('Server configuration error: GCP credentials missing')
    }

    let credentials
    try {
      const decodedCredentials = atob(credentialsString)
      credentials = JSON.parse(decodedCredentials)
      console.log('Successfully parsed GCP credentials')
    } catch (error) {
      console.error('Failed to parse GCP credentials:', error)
      throw new Error('Invalid server configuration: Failed to parse GCP credentials')
    }
    
    // Get access token for Google Cloud API
    console.log('Requesting Google Cloud access token')
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
    )

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Failed to get access token:', errorText)
      throw new Error('Failed to authenticate with Google Cloud')
    }

    const { access_token } = await tokenResponse.json()
    if (!access_token) {
      throw new Error('No access token received from Google Cloud')
    }

    console.log('Successfully obtained access token')

    // Process text in chunks
    console.log(`Processing text of length ${text.length} in chunks`)
    const audioContents = await processTextInChunks(text, voiceId, access_token)
    
    // Combine audio chunks
    console.log('Combining audio chunks')
    const combinedAudioContent = await combineAudioChunks(audioContents)
    
    console.log('Successfully generated audio content')
    
    return new Response(
      JSON.stringify({ 
        data: { 
          audioContent: combinedAudioContent,
          id: crypto.randomUUID()
        }
      }),
      { 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        } 
      }
    )

  } catch (error) {
    console.error('Error in convert-to-audio function:', error)
    console.error('Error stack:', error.stack)
    
    const errorResponse = {
      error: error.message || 'Internal server error',
      details: error.stack,
      timestamp: new Date().toISOString()
    }
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: error.status || 500,
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    )
  }
})

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
  
  // Convert PEM to binary
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = credentials.private_key
    .replace(/\\n/g, '\n')
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');
  
  const binaryDer = base64ToArrayBuffer(pemContents);

  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
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

// Helper function to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
