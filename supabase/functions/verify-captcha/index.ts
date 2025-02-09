
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
    
    if (!token) {
      console.error('No hCaptcha token provided');
      throw new Error('No hCaptcha token provided');
    }

    // Get the secret key from environment
    const secretKey = Deno.env.get('HCAPTCHA_SECRET');
    if (!secretKey) {
      console.error('HCAPTCHA_SECRET not found in environment');
      throw new Error('HCAPTCHA_SECRET not found in environment');
    }

    console.log('Starting hCaptcha verification with token length:', token.length);

    // Verify the token using hCaptcha verification endpoint
    const verificationURL = 'https://hcaptcha.com/siteverify';
    
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    
    const response = await fetch(verificationURL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      console.error('hCaptcha API response not ok:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`hCaptcha API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('hCaptcha API Response:', result);

    if (!result.success) {
      console.error('hCaptcha verification failed:', result['error-codes'] || []);
      throw new Error('hCaptcha verification failed');
    }

    return new Response(
      JSON.stringify({
        success: true,
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
    console.error('hCaptcha verification error:', error.message);
    
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
