import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processTextInChunks, combineAudioChunks } from './chunkProcessor.ts';
import { corsHeaders, responseHeaders } from './config/constants.ts';
import { initializeSupabaseClient, getGoogleAccessToken } from './services/clients.ts';
import type { ConversionRequest, ConversionResponse, ErrorResponse } from './types/index.ts';

console.log('Loading convert-to-audio function...');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
        conversionId: body.conversionId
      });
    } catch (e) {
      console.error('❌ Failed to parse request body:', e);
      throw new Error('Invalid request body');
    }

    const { text, voiceId, conversionId } = body;

    // Validaciones
    if (!text || typeof text !== 'string') {
      throw new Error('Text parameter must be a non-empty string');
    }

    if (!voiceId || typeof voiceId !== 'string') {
      throw new Error('VoiceId parameter must be a non-empty string');
    }

    if (!conversionId) {
      throw new Error('conversionId parameter is required');
    }

    // Inicializar clientes
    const supabaseClient = await initializeSupabaseClient();
    const accessToken = await getGoogleAccessToken();
    console.log('🔑 Successfully obtained access token');

    // Actualizar estado inicial de forma segura
    await safeSupabaseUpdate(supabaseClient, conversionId, {
      progress: 5,
      total_chunks: Math.ceil(text.length / 4800),
      processed_chunks: 0,
      status: 'processing'
    });

    try {
      const { audioContents } = await processTextInChunks(
        text,
        voiceId,
        accessToken,
        conversionId,
        supabaseClient,
        async (processedChunks: number) => {
          const totalChunks = Math.ceil(text.length / 4800);
          const progress = Math.min(
            Math.round((processedChunks / totalChunks) * 95) + 5,
            99
          );
          console.log(`📊 Progress: ${progress}% (${processedChunks}/${totalChunks} chunks)`);
          
          await safeSupabaseUpdate(supabaseClient, conversionId, {
            progress,
            processed_chunks: processedChunks
          });
        }
      );

      if (!audioContents || audioContents.length === 0) {
        throw new Error('No audio content generated from chunks');
      }
      
      // Combinar chunks de audio
      console.log('🔄 Combining audio chunks');
      const combinedAudioContent = await combineAudioChunks(audioContents);
      
      if (!combinedAudioContent) {
        throw new Error('Failed to combine audio chunks');
      }
      
      // Marcar como completado
      await safeSupabaseUpdate(supabaseClient, conversionId, {
        progress: 100,
        processed_chunks: Math.ceil(text.length / 4800),
        status: 'completed'
      });

      console.log('✅ Successfully generated audio content');
      
      return new Response(
        JSON.stringify({
          data: {
            audioContent: combinedAudioContent,
            id: crypto.randomUUID(),
            progress: 100
          }
        }),
        { headers: responseHeaders }
      );

    } catch (error) {
      console.error('❌ Error processing text:', error);
      
      // Actualizar estado de error
      await safeSupabaseUpdate(supabaseClient, conversionId, {
        status: 'failed',
        error_message: error.message
      });
        
      throw error;
    }

  } catch (error) {
    console.error('❌ Error in convert-to-audio function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: error.status || 500,
        headers: responseHeaders
      }
    );
  }
});

async function safeSupabaseUpdate(supabaseClient, id, data) {
  try {
    await supabaseClient
      .from('text_conversions')
      .update(data)
      .eq('id', id);
  } catch (error) {
    console.error('Error updating supabase:', error);
  }
}
