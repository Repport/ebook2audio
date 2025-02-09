
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
      
      // Validate the credentials format
      if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
        throw new Error('Invalid credentials format: missing required fields');
      }
      
      console.log('✅ Service account credentials decoded successfully');
      console.log('Project ID:', credentials.project_id);
    } catch (parseError) {
      console.error('Error decoding/parsing credentials:', parseError);
      throw new Error('Invalid service account credentials format');
    }

    console.log('Creating RecaptchaEnterpriseServiceClient...');
    
    const client = new RecaptchaEnterpriseServiceClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      projectId: credentials.project_id,
    });

    const projectPath = `projects/${credentials.project_id}`;
    console.log('Creating assessment for project path:', projectPath);

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

    console.log('Assessment response:', {
      score: assessment.riskAnalysis?.score,
      valid: assessment.tokenProperties?.valid,
      action: assessment.tokenProperties?.action,
    });

    return new Response(
      JSON.stringify({
        score: assessment.riskAnalysis?.score,
        valid: assessment.tokenProperties?.valid,
        action: assessment.tokenProperties?.action,
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
