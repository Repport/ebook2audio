
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

function cleanPrivateKey(key: string): string {
  // Remove any extra whitespace and ensure proper PEM format
  return key
    .replace(/\\n/g, '\n')
    .replace(/^\s+|\s+$/g, '')
    .replace('-----BEGIN PRIVATE KEY-----\n', '')
    .replace('\n-----END PRIVATE KEY-----', '');
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function getAccessToken(): Promise<string> {
  try {
    const serviceAccountBase64 = Deno.env.get('GCP_SERVICE_ACCOUNT');
    if (!serviceAccountBase64) {
      throw new Error('GCP service account credentials are missing');
    }

    let credentials: ServiceAccountCredentials;
    try {
      // Decode Base64 to JSON
      const serviceAccountJSON = atob(serviceAccountBase64);
      credentials = JSON.parse(serviceAccountJSON);
      console.log("✅ Google Cloud Service Account loaded successfully");
    } catch (e) {
      console.error('❌ Failed to parse GCP service account credentials:', e);
      throw new Error('Invalid GCP service account credentials format');
    }
    
    if (!credentials.client_email || !credentials.private_key) {
      console.error('Missing required fields in credentials:', 
        {
          hasEmail: !!credentials.client_email,
          hasKey: !!credentials.private_key
        }
      );
      throw new Error('Invalid service account format - missing required fields');
    }

    // Clean and decode the private key
    const cleanedKey = cleanPrivateKey(credentials.private_key);
    const keyData = base64ToArrayBuffer(cleanedKey);
    
    // Create the JWT claims
    const claims = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: getNumericDate(3600), // 1 hour from now
      iat: getNumericDate(0),
    };

    try {
      // Sign the JWT
      const key = await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      );

      const jwt = await create({ alg: 'RS256', typ: 'JWT' }, claims, key);
      console.log('✅ JWT created successfully');

      // Exchange the JWT for an access token
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
        throw new Error(`Failed to get access token: ${error}`);
      }

      const { access_token } = await tokenResponse.json();
      console.log('✅ Successfully obtained access token');
      return access_token;

    } catch (e) {
      console.error('Failed to create or exchange JWT:', e);
      throw e;
    }

  } catch (error) {
    console.error('Error in getAccessToken:', error);
    throw error;
  }
}
