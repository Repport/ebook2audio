
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
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    console.log('🚀 Starting text-to-speech conversion request');
    
    let body: ConversionRequest;
    try {
      const rawBody = await req.text();
      body = JSON.parse(rawBody);
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
    let processedCharacters = 0;
    
    try {
      // Dividir el texto en chunks respetando palabras completas y puntuación
      const chunks = text.match(/[^.!?]+[.!?]+|\s+|[^\s]+/g) || [text];
      const MAX_CHUNK_SIZE = 4800;
      let currentChunk = '';
      const processableChunks: string[] = [];
      
      // Agrupar chunks hasta alcanzar el tamaño máximo
      for (const chunk of chunks) {
        if ((currentChunk + chunk).length <= MAX_CHUNK_SIZE) {
          currentChunk += chunk;
        } else {
          if (currentChunk) {
            processableChunks.push(currentChunk);
          }
          currentChunk = chunk;
        }
      }
      if (currentChunk) {
        processableChunks.push(currentChunk);
      }

      console.log(`📝 Text split into ${processableChunks.length} chunks`);
      
      // Procesar chunks en batches para controlar concurrencia
      const BATCH_SIZE = 3;
      const audioContents: Uint8Array[] = [];
      
      for (let i = 0; i < processableChunks.length; i += BATCH_SIZE) {
        const batchChunks = processableChunks.slice(i, i + BATCH_SIZE);
        console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(processableChunks.length / BATCH_SIZE)}`);
        
        const batchResults = await Promise.all(
          batchChunks.map(async (chunk) => {
            const audioContent = await processTextInChunks(chunk, voiceId, accessToken);
            processedCharacters += chunk.length;
            
            // Calcular progreso basado en caracteres procesados
            const progress = Math.min(
              Math.round((processedCharacters / totalCharacters) * 90) + 5,
              95
            );

            console.log(`📊 Progress update: ${progress}% (${processedCharacters}/${totalCharacters} characters)`);

            // Actualizar progreso en Supabase
            const { error: updateError } = await supabaseClient
              .from('text_conversions')
              .update({
                progress,
                processed_characters: processedCharacters,
                total_characters: totalCharacters,
                status: 'processing',
                processed_chunks: i + batchChunks.length,
                total_chunks: processableChunks.length
              })
              .eq('id', conversionId);

            if (updateError) {
              console.error('❌ Error updating progress:', updateError);
            }

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
      const { error: finalUpdateError } = await supabaseClient
        .from('text_conversions')
        .update({
          status: 'completed',
          progress: 100,
          processed_characters: totalCharacters,
          total_characters: totalCharacters,
          processed_chunks: processableChunks.length,
          total_chunks: processableChunks.length
        })
        .eq('id', conversionId);

      if (finalUpdateError) {
        console.error('❌ Error updating final status:', finalUpdateError);
      }

      console.log('✅ Successfully generated and stored audio content');
      
      // Convert ArrayBuffer to base64 for response
      const uint8Array = new Uint8Array(combinedAudioContent);
      const base64Audio = btoa(String.fromCharCode(...uint8Array));
      
      const response: ConversionResponse = {
        data: {
          audioContent: base64Audio,
          id: conversionId,
          progress: 100
        }
      };

      return new Response(
        JSON.stringify(response),
        { 
          headers: {
            ...responseHeaders,
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (error) {
      console.error('❌ Error processing text:', error);
      
      // Actualizar estado de error
      const { error: updateError } = await supabaseClient
        .from('text_conversions')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', conversionId);

      if (updateError) {
        console.error('❌ Error updating error status:', updateError);
      }
        
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
        status: 500,
        headers: {
          ...responseHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
