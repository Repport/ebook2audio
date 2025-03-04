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
        chunkIndex: body.chunkIndex,
        totalChunks: body.totalChunks,
        conversionId: body.conversionId
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

    const { text, voiceId, fileName, chunkIndex, totalChunks, conversionId } = body;

    // Validations with improved error messages
    if (!text || typeof text !== 'string') {
      throw new Error('Text parameter must be a non-empty string');
    }

    if (!voiceId || typeof voiceId !== 'string') {
      throw new Error('VoiceId parameter must be a non-empty string');
    }

    // Update the conversion progress if we have a conversionId and this is a chunk
    if (conversionId && typeof chunkIndex === 'number' && typeof totalChunks === 'number') {
      try {
        // Calculate progress based on the index of the current chunk
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        
        // For individual chunks, limit progress to 99% until the final chunk
        const safeProgress = chunkIndex < totalChunks - 1 ? Math.min(progress, 99) : progress;
        
        // Update the progress table
        await supabase
          .from('conversion_progress')
          .upsert({
            conversion_id: conversionId,
            processed_chunks: chunkIndex + 1,
            total_chunks: totalChunks,
            processed_characters: Math.round((chunkIndex + 1) / totalChunks * text.length),
            total_characters: text.length,
            current_chunk: `Chunk ${chunkIndex + 1}/${totalChunks}`,
            progress: safeProgress,
            status: 'converting',
            updated_at: new Date().toISOString()
          }, { onConflict: 'conversion_id' });
          
        console.log(`📊 [${requestId}] Updated progress for conversion ${conversionId}: ${safeProgress}%`);
      } catch (progressError) {
        console.error(`⚠️ [${requestId}] Error updating progress:`, progressError);
        // Non-fatal error, continue with processing
      }
    }

    // Validate and process the chunk
    try {
      validateChunk(text);
      console.log(`✅ [${requestId}] Chunk validation passed: ${text.length} characters`);
    } catch (error) {
      console.error(`❌ [${requestId}] Chunk validation failed:`, error);
      
      // Update progress with error if we have a conversionId
      if (conversionId) {
        try {
          await supabase
            .from('conversion_progress')
            .upsert({
              conversion_id: conversionId,
              status: 'error',
              error_message: error.message,
              updated_at: new Date().toISOString()
            }, { onConflict: 'conversion_id' });
        } catch (progressError) {
          console.error(`⚠️ [${requestId}] Error updating progress with error:`, progressError);
        }
      }
      
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

    // Initialize clients
    const accessToken = await getGoogleAccessToken();
    console.log(`🔑 [${requestId}] Successfully obtained access token`);

    // Process the text chunk
    console.log(`🔄 [${requestId}] Processing text chunk of ${text.length} characters`);
    const result = await processTextInChunks(text, voiceId, accessToken);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ [${requestId}] Successfully processed text chunk in ${processingTime}ms`);
    
    // Calculate progress information
    let progress = 100; // Default to 100% for an individual chunk
    
    if (typeof chunkIndex === 'number' && typeof totalChunks === 'number' && totalChunks > 0) {
      // Calculate progress based on the index of the current chunk
      progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
      
      // Limit progress to 99% until the final chunk
      if (chunkIndex < totalChunks - 1) {
        progress = Math.min(progress, 99);
      }
      
      // Update the progress table for completed chunk
      if (conversionId) {
        try {
          const isLastChunk = chunkIndex === totalChunks - 1;
          await supabase
            .from('conversion_progress')
            .upsert({
              conversion_id: conversionId,
              processed_chunks: chunkIndex + 1,
              total_chunks: totalChunks,
              processed_characters: Math.round((chunkIndex + 1) / totalChunks * text.length),
              total_characters: text.length,
              current_chunk: isLastChunk ? 'Finalizing' : `Chunk ${chunkIndex + 1}/${totalChunks}`,
              progress: progress,
              status: isLastChunk ? 'completed' : 'converting',
              updated_at: new Date().toISOString()
            }, { onConflict: 'conversion_id' });
            
          console.log(`📊 [${requestId}] Updated final progress for chunk ${chunkIndex + 1}: ${progress}%`);
        } catch (progressError) {
          console.error(`⚠️ [${requestId}] Error updating final progress:`, progressError);
        }
      }
    }
    
    // Log successful conversion with improved data
    await supabase.from('system_logs').insert({
      event_type: 'conversion',
      details: {
        text_length: text.length,
        voiceId,
        fileName,
        processing_time_ms: processingTime,
        requestId,
        chunk_index: chunkIndex,
        total_chunks: totalChunks,
        progress,
        conversion_id: conversionId
      },
      status: 'success'
    });

    return new Response(
      JSON.stringify({
        data: {
          audioContent: result,
          progress: progress,
          processingTime,
          chunkIndex,
          totalChunks,
          characterCount: text.length,
          conversionId
        }
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ [${requestId}] Error in convert-to-audio function after ${processingTime}ms:`, error);
    
    // Try to extract the conversionId from the request
    let conversionId: string | undefined;
    try {
      const body = await req.json();
      conversionId = body.conversionId;
    } catch {}
    
    // Update progress with error if we have a conversionId
    if (conversionId) {
      try {
        const supabase = await initializeSupabaseClient();
        await supabase
          .from('conversion_progress')
          .upsert({
            conversion_id: conversionId,
            status: 'error',
            error_message: error.message || 'Unknown error',
            updated_at: new Date().toISOString()
          }, { onConflict: 'conversion_id' });
      } catch (progressError) {
        console.error(`⚠️ [${requestId}] Error updating progress with error:`, progressError);
      }
    }
    
    // Try to log the error to system_logs
    try {
      const supabase = await initializeSupabaseClient();
      await supabase.from('system_logs').insert({
        event_type: 'conversion_error',
        details: {
          error: error.message,
          stack: error.stack,
          processing_time_ms: processingTime,
          requestId,
          conversion_id: conversionId
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
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
