import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PREVIEW_TEXT = "Hello! This is a preview of my voice.";
const MODEL_ID = "eleven_monolingual_v1";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('ELEVEN_LABS_API_KEY')
    if (!apiKey) {
      console.error('ElevenLabs API key is not configured')
      throw new Error('ElevenLabs API key is missing');
    }

    // Test API connection first
    console.log('Testing ElevenLabs API connection...')
    const testResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      }
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('ElevenLabs API connection test failed:', errorText);
      throw new Error(`ElevenLabs API connection test failed: ${testResponse.status} ${testResponse.statusText}`);
    }

    console.log('ElevenLabs API connection test successful')

    // Continue with voice preview if connection test passed
    const { voiceId } = await req.json()
    console.log('Previewing voice:', voiceId)

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: PREVIEW_TEXT,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error response:', errorText, 'Status:', response.status);
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail?.status === 'quota_exceeded') {
          throw new Error('quota exceeded');
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Preview voice error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message?.includes('quota exceeded') ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})