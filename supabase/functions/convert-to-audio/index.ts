
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processTextInChunks, combineAudioChunks } from './chunkProcessor.ts';
import { corsHeaders, responseHeaders } from './config/constants.ts';
import { initializeSupabaseClient, getGoogleAccessToken } from './services/clients.ts';
import type { ConversionRequest, ConversionResponse, ErrorResponse } from './types/index.ts';

console.log('Loading convert-to-audio function...');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting text-to-speech conversion request');
    
    let body: ConversionRequest;
    try {
      body = await req.json();
      console.log('Request body received:', {
        textLength: body.text?.length,
        voiceId: body.voiceId,
        fileName: body.fileName,
        conversionId: body.conversionId
      });
    } catch (e) {
      console.error('Failed to parse request body:', e);
      throw new Error('Invalid request body');
    }

    const { text, voiceId, conversionId } = body;

    if (!text || typeof text !== 'string') {
      console.error('Missing or invalid text parameter:', { text });
      throw new Error('Text parameter must be a non-empty string');
    }

    if (!voiceId || typeof voiceId !== 'string') {
      console.error('Missing or invalid voiceId parameter:', { voiceId });
      throw new Error('VoiceId parameter must be a non-empty string');
    }

    if (!conversionId) {
      console.error('Missing conversionId parameter');
      throw new Error('conversionId parameter is required');
    }

    // Initialize clients
    const supabaseClient = await initializeSupabaseClient();
    const accessToken = await getGoogleAccessToken();
    console.log('Successfully obtained access token');

    // Process text in chunks
    console.log(`Processing text of length ${text.length} in chunks`);
    const { audioContents, progress } = await processTextInChunks(
      text, 
      voiceId, 
      accessToken, 
      conversionId,
      supabaseClient
    );
    
    // Combine audio chunks
    console.log('Combining audio chunks');
    const combinedAudioContent = await combineAudioChunks(audioContents);
    console.log('Successfully generated audio content');
    
    const response: ConversionResponse = {
      data: {
        audioContent: combinedAudioContent,
        id: crypto.randomUUID(),
        progress
      }
    };

    return new Response(JSON.stringify(response), { headers: responseHeaders });

  } catch (error) {
    console.error('Error in convert-to-audio function:', error);
    console.error('Error stack:', error.stack);
    
    const errorResponse: ErrorResponse = {
      error: error.message || 'Internal server error',
      details: error.stack,
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: error.status || 500,
        headers: responseHeaders
      }
    );
  }
});
