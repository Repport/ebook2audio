
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createJWT } from '../auth/googleAuth.ts';

// Variables para caché del token
let cachedAccessToken: string | null = null;
let tokenExpiration = 0;

export async function initializeSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function getGoogleAccessToken(): Promise<string> {
  // Verificar si hay un token cacheado válido
  if (cachedAccessToken && Date.now() < tokenExpiration) {
    console.log('Using cached Google access token');
    return cachedAccessToken;
  }

  console.log('Generating new Google access token');
  const credentialsString = Deno.env.get('GCP_SERVICE_ACCOUNT');
  if (!credentialsString) {
    throw new Error('Server configuration error: GCP credentials missing');
  }

  try {
    const decodedCredentials = atob(credentialsString);
    const credentials = JSON.parse(decodedCredentials);

    const tokenResponse = await fetch(
      'https://oauth2.googleapis.com/token',
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
      const errorText = await tokenResponse.text();
      console.error('Failed to get access token:', errorText);
      throw new Error('Failed to authenticate with Google Cloud');
    }

    const { access_token } = await tokenResponse.json();
    if (!access_token) {
      throw new Error('No access token received from Google Cloud');
    }

    // Actualizar caché del token
    cachedAccessToken = access_token;
    tokenExpiration = Date.now() + 55 * 60 * 1000; // 55 minutos para tener margen
    
    return access_token;
  } catch (error) {
    console.error('Error getting Google access token:', error);
    throw error;
  }
}
