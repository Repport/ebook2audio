
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createJWT } from '../auth/googleAuth.ts';

export async function initializeSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function getGoogleAccessToken(): Promise<string> {
  const credentialsString = Deno.env.get('GCP_SERVICE_ACCOUNT');
  if (!credentialsString) {
    throw new Error('Server configuration error: GCP credentials missing');
  }

  let credentials;
  try {
    const decodedCredentials = atob(credentialsString);
    credentials = JSON.parse(decodedCredentials);
    console.log('Successfully parsed GCP credentials');
  } catch (error) {
    console.error('Failed to parse GCP credentials:', error);
    throw new Error('Invalid server configuration: Failed to parse GCP credentials');
  }

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

  return access_token;
}
