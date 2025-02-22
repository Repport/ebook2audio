
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processTextInChunks } from './chunkProcessor.ts';
import { initializeSupabaseClient, getGoogleAccessToken } from './services/clients.ts';
import type { ConversionRequest, ConversionResponse, ErrorResponse } from './types/index.ts';

console.log('Loading convert-to-audio function...');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Authorization, X-Client-Info',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('🚀 Starting text-to-speech conversion request');
    
    let body: ConversionRequest;
    try {
      body = await req.json();
      console.log('📝 Request received:', {
        textLength: body.text?.length,
        voiceId: body.voiceId,
        fileName: body.fileName,
        isChunk: body.isChunk,
        chunkIndex: body.chunkIndex
      });
    } catch (e) {
      console.error('❌ Failed to parse request body:', e);
      throw new Error('Invalid request body');
    }

    const { text, voiceId, isChunk } = body;

    // Validaciones
    if (!text || typeof text !== 'string') {
      throw new Error('Text parameter must be a non-empty string');
    }

    if (!voiceId || typeof voiceId !== 'string') {
      throw new Error('VoiceId parameter must be a non-empty string');
    }

    // Verificación de tamaño para chunks individuales
    if (text.length > 4800) {
      throw new Error(`Text exceeds maximum length of 4800 characters (current: ${text.length})`);
    }

    // Inicializar clientes
    const accessToken = await getGoogleAccessToken();
    console.log('🔑 Successfully obtained access token');

    // Procesar el texto
    const result = await processTextInChunks(text, voiceId, accessToken);
    console.log('✅ Successfully processed text chunk');

    return new Response(
      JSON.stringify({
        data: {
          audioContent: result.audioContent,
          progress: 100
        }
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('❌ Error in convert-to-audio function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});
