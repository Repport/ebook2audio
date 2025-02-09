
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { RecaptchaEnterpriseServiceClient } from 'npm:@google-cloud/recaptcha-enterprise';

serve(async (req) => {
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
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
