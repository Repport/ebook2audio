
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processTextInChunks, combineAudioChunks } from './chunkProcessor.ts';
import { corsHeaders, responseHeaders } from './config/constants.ts';
import { initializeSupabaseClient, getGoogleAccessToken } from './services/clients.ts';
import type { ConversionRequest, ConversionResponse, ErrorResponse } from './types/index.ts';

console.log('Loading convert-to-audio function...');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      headers: corsHeaders
    });
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

    // Update initial progress and status
    await supabaseClient
      .from('text_conversions')
      .update({ 
        progress: 5,
        total_chunks: Math.ceil(text.length / 4800),
        processed_chunks: 0,
        status: 'processing'
      })
      .eq('id', conversionId);

    console.log(`Processing text of length ${text.length}`);
    
    // Process text in chunks with improved error handling
    try {
      const { audioContents } = await processTextInChunks(
        text, 
        voiceId, 
        accessToken, 
        conversionId,
        supabaseClient,
        async (processedChunks: number) => {
          const totalChunks = Math.ceil(text.length / 4800);
          const progress = Math.round((processedChunks / totalChunks) * 90) + 5;
          console.log(`Processed ${processedChunks}/${totalChunks} chunks, progress: ${progress}%`);
          
          await supabaseClient
            .from('text_conversions')
            .update({ 
              progress,
              processed_chunks: processedChunks
            })
            .eq('id', conversionId);
        }
      );

      if (!audioContents || audioContents.length === 0) {
        throw new Error('No audio content generated from chunks');
      }
      
      // Combine audio chunks and update final progress
      console.log('Combining audio chunks');
      const combinedAudioContent = await combineAudioChunks(audioContents);
      
      if (!combinedAudioContent) {
        throw new Error('Failed to combine audio chunks');
      }
      
      // Update progress to 100% when complete
      await supabaseClient
        .from('text_conversions')
        .update({ 
          progress: 100,
          processed_chunks: Math.ceil(text.length / 4800),
          status: 'completed'
        })
        .eq('id', conversionId);

      console.log('Successfully generated audio content');
      
      const response: ConversionResponse = {
        data: {
          audioContent: combinedAudioContent,
          id: crypto.randomUUID(),
          progress: 100
        }
      };

      return new Response(
        JSON.stringify(response), 
        { headers: responseHeaders }
      );

    } catch (error) {
      console.error('Error processing chunks:', error);
      
      // Update conversion status to failed
      await supabaseClient
        .from('text_conversions')
        .update({ 
          status: 'failed',
          error_message: error.message
        })
        .eq('id', conversionId);
        
      throw error;
    }

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
