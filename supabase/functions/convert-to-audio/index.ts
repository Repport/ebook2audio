
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processTextInChunks, combineAudioChunks } from './chunkProcessor.ts';
import { corsHeaders, responseHeaders } from './config/constants.ts';
import { initializeSupabaseClient, getGoogleAccessToken } from './services/clients.ts';
import type { ConversionRequest, ConversionResponse, ErrorResponse } from './types/index.ts';

console.log('Loading convert-to-audio function...');

// Estado global para tracking de progreso
const conversionStates = new Map<string, {
  processedCharacters: number;
  totalCharacters: number;
  lastUpdate: number;
}>();

// Función para dividir texto respetando palabras completas
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

// Función para actualizar el estado y decidir si escribir en Supabase
async function updateProgress(
  supabaseClient: any,
  conversionId: string,
  updates: Partial<{
    progress: number;
    processed_characters: number;
    status: string;
    error_message?: string;
    storage_path?: string;
  }>
) {
  const currentState = conversionStates.get(conversionId);
  if (!currentState) return;

  const now = Date.now();
  const shouldUpdate = 
    !currentState.lastUpdate || // Primera actualización
    (now - currentState.lastUpdate) > 2000 || // Han pasado 2 segundos
    updates.status || // Cambio de estado
    updates.error_message || // Error
    updates.storage_path; // Nueva ruta de almacenamiento

  if (shouldUpdate) {
    console.log('📝 Updating Supabase:', { conversionId, updates });
    await safeSupabaseUpdate(supabaseClient, conversionId, updates);
    conversionStates.set(conversionId, {
      ...currentState,
      lastUpdate: now
    });
  }
}

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

    // Configurar estado inicial
    const totalCharacters = text.length;
    conversionStates.set(conversionId, {
      processedCharacters: 0,
      totalCharacters,
      lastUpdate: 0
    });

    // Actualizar estado inicial
    await updateProgress(supabaseClient, conversionId, {
      progress: 5,
      processed_characters: 0,
      status: 'processing'
    });

    try {
      // Dividir el texto en chunks respetando palabras completas
      const chunks = splitTextIntoChunks(text);
      console.log(`📝 Text split into ${chunks.length} chunks`);
      
      // Procesar chunks en batches para controlar concurrencia
      const BATCH_SIZE = 3;
      let processedCharacters = 0;
      const audioContents = [];
      
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batchChunks = chunks.slice(i, i + BATCH_SIZE);
        console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`);
        
        const batchResults = await Promise.all(
          batchChunks.map(async (chunk) => {
            const result = await processTextInChunks(chunk, voiceId, accessToken);
            processedCharacters += chunk.length;
            
            const progress = Math.min(
              Math.round((processedCharacters / totalCharacters) * 90) + 5,
              95
            );

            await updateProgress(supabaseClient, conversionId, {
              progress,
              processed_characters: processedCharacters
            });

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
      
      // Marcar como completado y guardar ruta de storage
      await updateProgress(supabaseClient, conversionId, {
        progress: 100,
        processed_characters: totalCharacters,
        status: 'completed',
        storage_path: storagePath
      });

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
        { headers: responseHeaders }
      );

    } catch (error) {
      console.error('❌ Error processing text:', error);
      
      // Actualizar estado de error
      await updateProgress(supabaseClient, conversionId, {
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
