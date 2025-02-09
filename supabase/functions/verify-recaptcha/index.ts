
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { RecaptchaEnterpriseServiceClient } from 'npm:@google-cloud/recaptcha-enterprise';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, expectedAction } = await req.json();
    
    console.log('Received token:', token ? 'present' : 'missing');
    console.log('Expected action:', expectedAction);
    
    // Get the base64 encoded secret key from environment
    const encodedKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
    if (!encodedKey) {
      throw new Error('RECAPTCHA_SECRET_KEY not found in environment');
    }

    // Decode base64 to get the service account JSON
    let credentials;
    try {
      const decodedKey = atob(encodedKey);
      credentials = JSON.parse(decodedKey);
      if (!credentials.type || credentials.type !== 'service_account') {
        throw new Error('Invalid credentials format: missing or incorrect type field');
      }
      console.log('✅ Service account credentials decoded and validated successfully');
    } catch (parseError) {
      console.error('Error decoding/parsing credentials:', parseError);
      throw new Error('Invalid service account credentials format');
    }

    console.log('Initializing RecaptchaEnterpriseServiceClient...');
    
    const client = new RecaptchaEnterpriseServiceClient({
      credentials
    });
    
    const projectPath = `projects/${credentials.project_id}`;
    console.log('Creating assessment for project:', projectPath);

    const [assessment] = await client.createAssessment({
      parent: projectPath,
      assessment: {
        event: {
          token: token,
          expectedAction: expectedAction,
          siteKey: '6LcXU9EqAAAAAElRyhh7eJESVVY6pHOnt2XRfYIQ',
        },
      },
    });

    console.log('Assessment created:', {
      score: assessment.riskAnalysis?.score,
      valid: assessment.tokenProperties?.valid,
    });

    return new Response(
      JSON.stringify({
        score: assessment.riskAnalysis?.score,
        valid: assessment.tokenProperties?.valid,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
