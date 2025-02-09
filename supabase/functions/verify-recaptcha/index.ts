
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
    const { token, expectedAction } = await req.json();
    
    if (!token) {
      console.error('No reCAPTCHA token provided');
      throw new Error('No reCAPTCHA token provided');
    }

    // Detailed logging to help diagnose issues
    console.log('Processing reCAPTCHA verification:');
    console.log('- Token length:', token.length);
    console.log('- Expected action:', expectedAction);

    // Get the secret key from environment
    const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY not found in environment');
      throw new Error('RECAPTCHA_SECRET_KEY not found in environment');
    }

    // Verify the token using reCAPTCHA v3 verification endpoint
    const verificationURL = 'https://www.google.com/recaptcha/api/siteverify';
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    console.log('Sending verification request to reCAPTCHA...');

    const response = await fetch(verificationURL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('reCAPTCHA API response not ok:', response.status, response.statusText);
      throw new Error(`reCAPTCHA API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Log the complete verification response for debugging
    console.log('Verification response:', {
      success: result.success,
      score: result.score,
      action: result.action,
      timestamp: result.challenge_ts,
      hostname: result.hostname,
      errors: result['error-codes']
    });

    if (!result.success) {
      throw new Error('reCAPTCHA verification failed: ' + (result['error-codes']?.join(', ') || 'unknown error'));
    }

    // For v3, we should also verify the score and action
    if (result.action !== expectedAction) {
      throw new Error(`reCAPTCHA action mismatch. Expected: ${expectedAction}, Got: ${result.action}`);
    }

    // Score ranges from 0.0 to 1.0, where 1.0 is very likely a good interaction
    if (result.score < 0.5) {
      throw new Error(`reCAPTCHA score too low: ${result.score}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        score: result.score,
        action: result.action,
        timestamp: result.challenge_ts,
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
