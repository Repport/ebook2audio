
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

export async function getAccessToken(): Promise<string> {
  try {
    const serviceAccount = Deno.env.get('GCP_SERVICE_ACCOUNT');
    if (!serviceAccount) {
      throw new Error('GCP service account credentials are missing');
    }

    const credentials: ServiceAccountCredentials = JSON.parse(serviceAccount);
    
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Invalid service account format');
    }

    const now = Math.floor(Date.now() / 1000);
    const jwt = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt.toString(),
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token request failed:', error);
      throw new Error(`Failed to get access token: ${error}`);
    }

    const { access_token } = await tokenResponse.json();
    console.log('Successfully obtained access token');
    return access_token;

  } catch (error) {
    console.error('Error in getAccessToken:', error);
    throw error;
  }
}
