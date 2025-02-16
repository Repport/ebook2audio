
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processTextInChunks, combineAudioChunks } from './chunkProcessor.ts';
import { corsHeaders, responseHeaders } from './config/constants.ts';
import { initializeSupabaseClient, getGoogleAccessToken } from './services/clients.ts';
import { synthesizeSpeech } from './speech-service.ts';
import type { ConversionRequest, ConversionResponse, ErrorResponse } from './types/index.ts';

console.log('Loading convert-to-audio function...');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 405,
        headers: responseHeaders
      }
    );
  }

  try {
    console.log('🚀 Starting text-to-speech conversion request');
    
    let body: ConversionRequest;
    try {
      const text = await req.text();
      console.log('Raw request body:', text);
      body = JSON.parse(text);
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

    // Validaciones básicas
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

    // Configurar estado inicial
    const totalCharacters = text.length;
    
    try {
      // Dividir el texto en chunks respetando palabras completas
      const chunks = text.match(/[\s\S]{1,4800}(?=\s|$)/g) || [text];
      console.log(`📝 Text split into ${chunks.length} chunks`);
      
      // Procesar chunks en batches para controlar concurrencia
      const BATCH_SIZE = 3;
      let processedCharacters = 0;
      const audioContents: Uint8Array[] = [];
      
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batchChunks = chunks.slice(i, i + BATCH_SIZE);
        console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`);
        
        const batchResults = await Promise.all(
          batchChunks.map(async (chunk) => {
            const audioContent = await synthesizeSpeech(chunk, voiceId, accessToken);
            processedCharacters += chunk.length;
            
            // Calcular progreso basado en caracteres procesados
            const progress = Math.min(
              Math.round((processedCharacters / totalCharacters) * 90) + 5,
              95
            );

            // Actualizar progreso en Supabase
            await supabaseClient
              .from('text_conversions')
              .update({
                progress,
                processed_characters: processedCharacters,
                total_characters: totalCharacters,
                status: 'processing'
              })
              .eq('id', conversionId);

            // Convert base64 to Uint8Array
            const binaryString = atob(audioContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
          })
        );

        audioContents.push(...batchResults);
      }

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
      await supabaseClient
        .from('text_conversions')
        .update({
          status: 'completed',
          progress: 100,
          processed_characters: totalCharacters,
          total_characters: totalCharacters
        })
        .eq('id', conversionId);

      console.log('✅ Successfully generated and stored audio content');
      
      // Convert Uint8Array back to base64 for response
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(combinedAudioContent)));
      
      const response: ConversionResponse = {
        data: {
          audioContent: base64Audio,
          id: conversionId,
          progress: 100
        }
      };

      return new Response(
        JSON.stringify(response),
        { headers: responseHeaders }
      );

    } catch (error) {
      console.error('❌ Error processing text:', error);
      
      // Actualizar estado de error
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
    console.error('❌ Error in convert-to-audio function:', error);
    
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
