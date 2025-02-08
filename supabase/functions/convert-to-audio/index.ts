
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const chunks: string[] = [];
  const chunkSize = 8192;
  const uint8Array = new Uint8Array(buffer);
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    const binary = String.fromCharCode.apply(null, [...chunk]);
    chunks.push(btoa(binary));
  }
  
  return chunks.join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId = 'en-US-Standard-C' } = await req.json();
    console.log('Request received with text length:', text.length, 'and voice:', voiceId);

    const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (!apiKey) {
      console.error('Google Cloud API key is not configured');
      throw new Error('Google Cloud API key is missing');
    }

    // Clean and prepare the text
    const cleanedText = text.trim();
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
      }
    };

    console.log('Making request to Google Cloud Text-to-Speech API...');
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    
    // Google Cloud returns base64 directly, but we need to decode it first
    // to get the actual audio buffer for our player
    const audioBuffer = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0)).buffer;
    
    // Convert back to our expected format
    const audioBase64 = arrayBufferToBase64(audioBuffer);
    console.log('Audio data processed, sending response...');

    return new Response(
      JSON.stringify({ audioContent: audioBase64 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Detailed conversion error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
