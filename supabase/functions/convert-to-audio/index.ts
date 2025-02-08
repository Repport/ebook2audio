
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getAccessToken } from "../preview-voice/auth.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function cleanText(text: string): string {
  return text
    // Replace multiple newlines with a single one
    .replace(/\n+/g, '\n')
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ')
    // Remove any non-printable characters
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    // Remove common PDF artifacts
    .replace(/\[pdf\]/gi, '')
    .replace(/\[page\s*\d*\]/gi, '')
    // Replace unicode quotes with standard quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Add proper punctuation for better speech synthesis
    .replace(/([.!?])\s*(\w)/g, '$1 $2')
    // Trim extra whitespace
    .trim();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      }
    });
  }

  try {
    const { text, voiceId = 'en-US-Standard-C' } = await req.json();
    console.log('Request received with text length:', text.length, 'and voice:', voiceId);

    // Get access token using the shared authentication module
    const accessToken = await getAccessToken();
    console.log('✅ Successfully obtained access token');

    // Clean and prepare the text
    const cleanedText = cleanText(text);
    console.log('Cleaned text sample:', cleanedText.substring(0, 100) + '...');
    
    if (!cleanedText) {
      throw new Error('No text content to convert');
    }

    // Prepare request to Google Cloud Text-to-Speech API
    const requestBody = {
      input: { text: cleanedText },
      voice: {
        languageCode: 'en-US',
        name: voiceId,
        ssmlGender: voiceId.includes('Standard-C') ? 'FEMALE' : 'MALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
        // Add emphasis on punctuation for better story narration
        effectsProfileId: ['handset-class-device'],
      }
    };

    console.log('Making request to Google Cloud Text-to-Speech API...');
    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
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
    console.log('Audio data processed, sending response...');

    return new Response(
      JSON.stringify({ audioContent: data.audioContent }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Detailed conversion error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
