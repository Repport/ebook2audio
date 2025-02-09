
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
    
    console.log('Received token:', token ? 'present' : 'missing');
    console.log('Expected action:', expectedAction);

    // Get the secret key from environment
    const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
    if (!secretKey) {
      throw new Error('RECAPTCHA_SECRET_KEY not found in environment');
    }

    // Verify the token using reCAPTCHA v2 verification endpoint
    const verificationURL = 'https://www.google.com/recaptcha/api/siteverify';
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    console.log('Sending verification request to reCAPTCHA...');

    const response = await fetch(verificationURL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    console.log('Verification response:', result);

    if (!result.success) {
      throw new Error('reCAPTCHA verification failed: ' + (result['error-codes']?.join(', ') || 'unknown error'));
    }

    return new Response(
      JSON.stringify({
        success: result.success,
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
