
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
