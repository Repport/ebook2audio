import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { voiceId } = await req.json()
    console.log('Previewing voice:', voiceId)

    const apiKey = Deno.env.get('ELEVEN_LABS_API_KEY')
    if (!apiKey) {
      console.error('ElevenLabs API key is not configured')
      throw new Error('ElevenLabs API key is missing')
    }

    console.log('Making request to ElevenLabs API...')
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: "Hello! This is a preview of my voice. I hope you like it!",
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error response:', errorText)
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`)
    }

    console.log('Successfully received response from ElevenLabs')
    const audioData = await response.arrayBuffer()
    console.log('Successfully processed audio data, size:', audioData.byteLength)
    
    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg'
      }
    })
  } catch (error) {
    console.error('Preview voice error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    })
  }
})