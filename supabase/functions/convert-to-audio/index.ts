
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processTextInChunks } from './chunkProcessor.ts';
import { initializeSupabaseClient, getGoogleAccessToken } from './services/clients.ts';
import { validateChunk, splitTextIntoChunks } from './utils.ts';
import { corsHeaders } from '../_shared/cors.ts';
import type { ConversionRequest, ConversionResponse, ErrorResponse } from './types/index.ts';

console.log('Loading convert-to-audio function...');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  console.log(`🚀 [${requestId}] Starting text-to-speech conversion request`);
  
  try {
    // Initialize Supabase client for logging
    const supabase = await initializeSupabaseClient();
    
    // Parse request body with better error handling
    let body: ConversionRequest;
    try {
      body = await req.json();
      console.log(`📝 [${requestId}] Request received:`, {
        textLength: body.text?.length,
        voiceId: body.voiceId,
        fileName: body.fileName,
        isChunk: body.isChunk,
        chunkIndex: body.chunkIndex
      });
    } catch (e) {
      console.error(`❌ [${requestId}] Failed to parse request body:`, e);
      
      // Log parsing error
      await supabase.from('system_logs').insert({
        event_type: 'conversion_error',
        details: {
          error_type: 'request_parsing',
          message: e.message,
          requestId
        },
        status: 'error'
      });
      
      throw new Error('Invalid request body: ' + e.message);
    }

    const { text, voiceId, fileName } = body;

    // Validations with improved error messages
    if (!text || typeof text !== 'string') {
      throw new Error('Text parameter must be a non-empty string');
    }

    if (!voiceId || typeof voiceId !== 'string') {
      throw new Error('VoiceId parameter must be a non-empty string');
    }

    // Validate and process the chunk
    try {
      validateChunk(text);
      console.log(`✅ [${requestId}] Chunk validation passed: ${text.length} characters`);
    } catch (error) {
      console.error(`❌ [${requestId}] Chunk validation failed:`, error);
      
      // Log validation error
      await supabase.from('system_logs').insert({
        event_type: 'conversion_error',
        details: {
          error_type: 'chunk_validation',
          message: error.message,
          text_length: text?.length,
          requestId
        },
        status: 'error'
      });
      
      throw error;
    }

    // Inicializar clientes
    const accessToken = await getGoogleAccessToken();
    console.log(`🔑 [${requestId}] Successfully obtained access token`);

    // Process the text chunk
    console.log(`🔄 [${requestId}] Processing text chunk of ${text.length} characters`);
    const result = await processTextInChunks(text, voiceId, accessToken);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ [${requestId}] Successfully processed text chunk in ${processingTime}ms`);
    
    // Log successful conversion
    await supabase.from('system_logs').insert({
      event_type: 'conversion',
      details: {
        text_length: text.length,
        voiceId,
        fileName,
        processing_time_ms: processingTime,
        requestId
      },
      status: 'success'
    });

    return new Response(
      JSON.stringify({
        data: {
          audioContent: result,
          progress: 100,
          processingTime
        }
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ [${requestId}] Error in convert-to-audio function after ${processingTime}ms:`, error);
    
    // Try to log the error to system_logs
    try {
      const supabase = await initializeSupabaseClient();
      await supabase.from('system_logs').insert({
        event_type: 'conversion_error',
        details: {
          error: error.message,
          stack: error.stack,
          processing_time_ms: processingTime,
          requestId
        },
        status: 'error'
      });
    } catch (logError) {
      console.error(`❌ [${requestId}] Failed to log error to system_logs:`, logError);
    }
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.stack,
        timestamp: new Date().toISOString(),
        requestId
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});
