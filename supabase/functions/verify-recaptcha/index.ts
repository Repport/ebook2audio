
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

    const result = await response.json();

    console.log('Verification response:', result);

    if (!result.success) {
      throw new Error('reCAPTCHA verification failed: ' + (result['error-codes']?.join(', ') || 'unknown error'));
    }

    // For v3, we should also verify the score and action
    if (result.action !== expectedAction) {
      throw new Error('reCAPTCHA action mismatch');
    }

    // Score ranges from 0.0 to 1.0, where 1.0 is very likely a good interaction
    // You might want to adjust this threshold based on your needs
    if (result.score < 0.5) {
      throw new Error('reCAPTCHA score too low');
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
