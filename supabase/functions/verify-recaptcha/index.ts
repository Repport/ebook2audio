
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

    console.log('Starting reCAPTCHA verification with:', {
      tokenLength: token.length,
      expectedAction,
    });

    // Verify the token using reCAPTCHA v3 verification endpoint
    const verificationURL = 'https://www.google.com/recaptcha/api/siteverify';
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const response = await fetch(verificationURL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('reCAPTCHA API response not ok:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`reCAPTCHA API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('reCAPTCHA API Response:', result);

    // Log verification details
    console.log('Verification details:', {
      success: result.success,
      score: result.score,
      action: result.action,
      timestamp: result.challenge_ts,
      hostname: result.hostname,
      errors: result['error-codes']
    });

    if (!result.success) {
      const errorMessage = result['error-codes']?.join(', ') || 'Unknown error';
      console.error('reCAPTCHA verification failed:', errorMessage);
      throw new Error(`reCAPTCHA verification failed: ${errorMessage}`);
    }

    // For v3, verify the action and score
    if (expectedAction && result.action !== expectedAction) {
      console.error('Action mismatch:', {
        expected: expectedAction,
        received: result.action
      });
      throw new Error(`Action mismatch. Expected: ${expectedAction}, Got: ${result.action}`);
    }

    // Score ranges from 0.0 to 1.0, where 1.0 is very likely a good interaction
    const minScore = 0.3; // Lowered threshold for testing
    if (result.score < minScore) {
      console.error('Score too low:', result.score);
      throw new Error(`Score too low: ${result.score}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        score: result.score,
        action: result.action,
        timestamp: result.challenge_ts
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('reCAPTCHA verification error:', error.message);
    
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
