
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PREVIEW_TEXT = "Hello! This is a preview of my voice.";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const credentials = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS');
    if (!credentials) {
      console.error('Google Cloud credentials are not configured');
      throw new Error('Google Cloud credentials are missing');
    }

    const { voiceId } = await req.json();
    console.log('Previewing voice:', voiceId);

    // Clean and prepare the text
    const cleanedText = PREVIEW_TEXT.trim();
    if (!cleanedText) {
      throw new Error('No text content to convert');
    }

    // Determine voice gender based on voice ID
    const ssmlGender = voiceId.includes('Standard-C') ? 'FEMALE' : 'MALE';

    // Prepare request to Google Cloud Text-to-Speech API
    const requestBody = {
      input: { text: cleanedText },
      voice: {
        languageCode: 'en-US',
        name: voiceId,
        ssmlGender
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
      }
    };

    console.log('Making request to Google Cloud Text-to-Speech API with body:', JSON.stringify(requestBody));
    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(credentials).private_key}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Cloud API failed with status:', response.status);
      console.error('Error response:', errorText);
      throw new Error(`Google Cloud API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully received response from Google Cloud API');
    
    // Google Cloud returns base64 directly, but we need to decode it first
    // to get the actual audio buffer for our player
    const audioBuffer = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0)).buffer;
    
    // Convert back to our expected format
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    console.log('Audio data processed, sending response...');

    return new Response(
      JSON.stringify({ audioContent: audioBase64 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Preview voice error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
