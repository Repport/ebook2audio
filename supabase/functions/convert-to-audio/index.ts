
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Convert ArrayBuffer to base64 in chunks to prevent stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const chunks: string[] = [];
  const chunkSize = 8192; // Process 8KB at a time
  const uint8Array = new Uint8Array(buffer);
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    const binary = String.fromCharCode.apply(null, [...chunk]);
    chunks.push(btoa(binary));
  }
  
  return chunks.join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId } = await req.json();
    console.log('Request received with text length:', text.length, 'and voice ID:', voiceId);

    const apiKey = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!apiKey) {
      console.error('ElevenLabs API key is not configured');
      throw new Error('ElevenLabs API key is missing. Please configure it in Supabase Edge Function secrets.');
    }
    console.log('API key found, length:', apiKey.length);

    // Test API connection first with a simpler endpoint
    console.log('Testing API connection...');
    const testResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      }
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('ElevenLabs API test failed with status:', testResponse.status);
      console.error('Error response:', errorText);
      throw new Error(`ElevenLabs API test failed: ${testResponse.status} ${testResponse.statusText}`);
    }
    console.log('API test successful');

    // Prepare the text for conversion
    const cleanedText = text.trim();
    if (!cleanedText) {
      throw new Error('No text content to convert');
    }
    console.log('Cleaned text length:', cleanedText.length);

    // Make the text-to-speech request
    console.log('Starting text-to-speech conversion...');
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanedText,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs conversion failed with status:', response.status);
      console.error('Error response:', errorText);
      throw new Error(`ElevenLabs conversion failed: ${response.status} ${response.statusText}`);
    }

    console.log('Conversion successful, processing audio data...');
    const audioBuffer = await response.arrayBuffer();
    console.log('Audio buffer size:', audioBuffer.byteLength, 'bytes');
    
    // Use the chunked conversion method
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
        status: error.message?.includes('API key') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
