
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
    
    // Get the secret key from environment
    const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
    if (!secretKey) {
      throw new Error('RECAPTCHA_SECRET_KEY not found in environment');
    }

    console.log('Initializing RecaptchaEnterpriseServiceClient...');
    
    const client = new RecaptchaEnterpriseServiceClient({
      credentials: JSON.parse(secretKey)
    });
    const projectPath = `projects/ambient-tuner-450319-g2`;

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
