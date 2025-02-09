
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
    
    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = `projects/ambient-tuner-450319-g2`;

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
