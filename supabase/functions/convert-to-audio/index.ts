import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processTextInChunks, combineAudioChunks } from './chunkProcessor.ts';
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

function splitTextIntoChunks(text: string, maxChunkSize: number = 4800): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    const wordLength = word.length;
    const spaceLength = currentChunk.length > 0 ? 1 : 0;
    const potentialLength = currentLength + wordLength + spaceLength;

    if (potentialLength > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
      currentLength = wordLength;
    } else {
      currentChunk.push(word);
      currentLength = potentialLength;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

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

    // Dividir el texto y crear chunks en la base de datos
    const chunks = splitTextIntoChunks(text);
    console.log(`📝 Text split into ${chunks.length} chunks`);

    // Crear registros de chunks
    const chunkRecords = chunks.map((content, index) => ({
      conversion_id: conversionId,
      content,
      character_count: content.length,
      chunk_index: index,
      status: 'pending'
    }));

    const { error: insertError } = await supabaseClient
      .from('conversion_chunks')
      .insert(chunkRecords);

    if (insertError) {
      console.error('❌ Error creating chunk records:', insertError);
      throw new Error('Failed to initialize conversion chunks');
    }

    // Actualizar estado inicial de la conversión
    await supabaseClient
      .from('text_conversions')
      .update({
        status: 'processing',
        progress: 5,
        total_chunks: chunks.length,
        total_characters: text.length
      })
      .eq('id', conversionId);

    try {
      // Procesar chunks en batches
      const BATCH_SIZE = 3;
      const audioContents = [];
      
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batchChunks = chunks.slice(i, i + BATCH_SIZE);
        console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`);
        
        const batchResults = await Promise.all(
          batchChunks.map(async (chunk, batchIndex) => {
            const chunkIndex = i + batchIndex;
            const result = await processTextInChunks(chunk, voiceId, accessToken);
            
            // Actualizar estado del chunk
            await supabaseClient
              .from('conversion_chunks')
              .update({
                status: 'completed',
                processed_at: new Date().toISOString()
              })
              .eq('conversion_id', conversionId)
              .eq('chunk_index', chunkIndex);

            return result;
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

      // Guardar el audio en storage
      const storagePath = `${conversionId}.mp3`;
      const audioBuffer = Uint8Array.from(atob(combinedAudioContent), c => c.charCodeAt(0));

      const { error: uploadError } = await supabaseClient.storage
        .from('audio_cache')
        .upload(storagePath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ Error uploading to storage:', uploadError);
        throw new Error('Failed to store audio file');
      }
      
      // Marcar como completado
      await supabaseClient
        .from('text_conversions')
        .update({
          status: 'completed',
          progress: 100,
          storage_path: storagePath
        })
        .eq('id', conversionId);

      console.log('✅ Successfully generated and stored audio content');
      
      return new Response(
        JSON.stringify({
          data: {
            audioContent: combinedAudioContent,
            id: conversionId,
            progress: 100,
            storagePath
          }
        }),
        { headers: corsHeaders }
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
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: error.status || 500,
        headers: corsHeaders
      }
    );
  }
});

async function safeSupabaseUpdate(supabaseClient: any, id: string, data: any) {
  try {
    await supabaseClient
      .from('text_conversions')
      .update(data)
      .eq('id', id);
  } catch (error) {
    console.error('Error updating supabase:', error);
  }
}
