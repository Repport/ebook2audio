
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    const requestData = await req.json();
    const { token } = requestData;
    const expectedAction = requestData.expectedAction || 'terms_acceptance';
    
    if (!token) {
      console.error('No reCAPTCHA token provided');
      throw new Error('No reCAPTCHA token provided');
    }

    // Get the secret key from environment
    const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY not found in environment');
      throw new Error('RECAPTCHA_SECRET_KEY not found in environment');
    }

    console.log('Starting reCAPTCHA Enterprise verification with:', {
      tokenLength: token.length,
      expectedAction,
      projectId: 'ambient-tuner-450319-g2'
    });

    // Verify the token using reCAPTCHA Enterprise verification endpoint
    const verificationURL = 'https://recaptchaenterprise.googleapis.com/v1/assessment';
    
    const response = await fetch(`${verificationURL}?key=${secretKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: {
          token,
          expectedAction,
          siteKey: Deno.env.get('RECAPTCHA_SITE_KEY'),
        },
        project_id: 'ambient-tuner-450319-g2',
      }),
    });

    if (!response.ok) {
      console.error('reCAPTCHA Enterprise API response not ok:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`reCAPTCHA Enterprise API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('reCAPTCHA Enterprise API Response:', result);

    // Enterprise assessment response structure is different
    const score = result.riskAnalysis?.score || 0;
    const tokenProperties = result.tokenProperties || {};

    console.log('Verification details:', {
      score,
      action: tokenProperties.action,
      valid: result.tokenProperties?.valid,
      timestamp: new Date().toISOString(),
    });

    if (!tokenProperties.valid) {
      console.error('reCAPTCHA Enterprise verification failed:', result.riskAnalysis?.reasons || []);
      throw new Error('reCAPTCHA Enterprise verification failed');
    }

    // For Enterprise, verify the action and score
    if (expectedAction && tokenProperties.action !== expectedAction) {
      console.error('Action mismatch:', {
        expected: expectedAction,
        received: tokenProperties.action
      });
      throw new Error(`Action mismatch. Expected: ${expectedAction}, Got: ${tokenProperties.action}`);
    }

    // Score ranges from 0.0 to 1.0, where 1.0 is very likely a good interaction
    const minScore = 0.3; // Lowered threshold for testing
    if (score < minScore) {
      console.error('Score too low:', score);
      throw new Error(`Score too low: ${score}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        score,
        action: tokenProperties.action,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('reCAPTCHA Enterprise verification error:', error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
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
