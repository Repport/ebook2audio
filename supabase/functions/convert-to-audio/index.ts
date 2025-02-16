
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
      const rawBody = await req.json();
      body = rawBody;
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

    // Inicializar clientes con timeout más largo
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 540000); // 9 minutos de timeout

    try {
      const supabaseClient = await initializeSupabaseClient();
      const accessToken = await getGoogleAccessToken();
      console.log('🔑 Successfully obtained access token');

      // Obtener el estado actual de caracteres procesados
      const { data: currentState, error: stateError } = await supabaseClient
        .from('text_conversions')
        .select('processed_characters')
        .eq('id', conversionId)
        .single();

      if (stateError) {
        console.error('❌ Error fetching current state:', stateError);
        throw stateError;
      }

      // Inicializar con los caracteres ya procesados
      const totalCharacters = text.length;
      let processedCharacters = currentState?.processed_characters || 0;
      
      console.log('📊 Starting conversion with:', {
        totalCharacters,
        currentProcessedCharacters: processedCharacters
      });

      // Dividir el texto en chunks más pequeños (máximo 4000 caracteres)
      const chunks = text.match(/[^.!?]+[.!?]+|\s+|[^\s]+/g) || [text];
      const MAX_CHUNK_SIZE = 4000;
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
      
      // Procesar chunks en batches más pequeños para controlar concurrencia
      const BATCH_SIZE = 2;
      const audioContents: Uint8Array[] = [];
      
      for (let i = 0; i < processableChunks.length; i += BATCH_SIZE) {
        const batchChunks = processableChunks.slice(i, i + BATCH_SIZE);
        console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(processableChunks.length / BATCH_SIZE)}`);
        
        const batchResults = await Promise.all(
          batchChunks.map(async (chunk) => {
            const audioContent = await processTextInChunks(chunk, voiceId, accessToken);
            
            // Incrementar caracteres procesados
            const newProcessedCharacters = processedCharacters + chunk.length;
            
            // Calcular progreso basado en caracteres procesados
            const progress = Math.min(
              Math.round((newProcessedCharacters / totalCharacters) * 90) + 5,
              95
            );

            console.log(`📊 Progress update: ${progress}% (${newProcessedCharacters}/${totalCharacters} characters)`);

            // Actualizar progreso en Supabase usando un incremento
            const { error: updateError } = await supabaseClient
              .rpc('increment_processed_characters', {
                p_conversion_id: conversionId,
                p_increment: chunk.length,
                p_progress: progress,
                p_total_characters: totalCharacters,
                p_processed_chunks: i + batchChunks.length,
                p_total_chunks: processableChunks.length
              });

            if (updateError) {
              console.error('❌ Error updating progress:', updateError);
            }

            // Actualizar el contador local
            processedCharacters = newProcessedCharacters;

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

      clearTimeout(timeout);

      if (!audioContents || audioContents.length === 0) {
        throw new Error('No audio content generated from chunks');
      }
      
      // Combinar chunks de audio
      console.log('🔄 Combining audio chunks');
      const combinedAudioContent = await combineAudioChunks(audioContents);
      
      if (!combinedAudioContent) {
        throw new Error('Failed to combine audio chunks');
      }

      // Convertir ArrayBuffer a base64 para response
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
      clearTimeout(timeout);
      
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
