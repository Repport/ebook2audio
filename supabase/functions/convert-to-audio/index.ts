
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config/constants.ts';
import { getGoogleAccessToken } from './services/clients.ts';
import { synthesizeSpeech } from './speech-service.ts';

console.log('Loading convert-to-audio function...');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    console.log('🚀 Starting text-to-speech conversion request');
    
    let body;
    try {
      body = await req.json();
      console.log('📝 Request parsed:', {
        textLength: body.text?.length,
        voiceId: body.voiceId,
        fileName: body.fileName,
        conversionId: body.conversionId
      });
    } catch (e) {
      console.error('❌ Failed to parse request body:', e);
      throw new Error(`Invalid request body: ${e.message}`);
    }

    const { text, voiceId, conversionId } = body;

    // Basic validations
    if (!text || typeof text !== 'string') {
      throw new Error('Text parameter must be a non-empty string');
    }

    if (!voiceId || typeof voiceId !== 'string') {
      throw new Error('VoiceId parameter must be a non-empty string');
    }

    if (!conversionId) {
      throw new Error('conversionId parameter is required');
    }

    const googleAccessToken = await getGoogleAccessToken();
    console.log('🔑 Successfully obtained access token');

    const audioContent = await synthesizeSpeech(text, voiceId, googleAccessToken);
    console.log('🎵 Successfully generated audio content');

    return new Response(
      JSON.stringify({ audioContent }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('❌ Error in convert-to-audio function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
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
