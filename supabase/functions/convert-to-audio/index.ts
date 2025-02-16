
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
      body = rawBody as ConversionRequest;
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

    // Basic validations
    if (!text || typeof text !== 'string') {
      throw new Error('Text parameter must be a non-empty string');
    }

    if (!voiceId || typeof voiceId !== 'string') {
      throw new Error('VoiceId parameter must be a non-empty string');
    }

    if (!conversionId) {
      throw new Error('conversionId parameter is required');
    }

    // Initialize clients with longer timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 540000); // 9 minutes timeout

    try {
      const supabaseClient = await initializeSupabaseClient();
      const accessToken = await getGoogleAccessToken();
      console.log('🔑 Successfully obtained access token');

      // Get current state of processed characters
      const { data: currentState, error: stateError } = await supabaseClient
        .from('text_conversions')
        .select('processed_characters')
        .eq('id', conversionId)
        .single();

      if (stateError) {
        console.error('❌ Error fetching current state:', stateError);
        throw stateError;
      }

      // Initialize with already processed characters
      const totalCharacters = text.length;
      let processedCharacters = currentState?.processed_characters || 0;
      
      console.log('📊 Starting conversion with:', {
        totalCharacters,
        currentProcessedCharacters: processedCharacters
      });

      // Split text into smaller chunks (max 4000 characters)
      const chunks = text.match(/[^.!?]+[.!?]+|\s+|[^\s]+/g) || [text];
      const MAX_CHUNK_SIZE = 4000;
      let currentChunk = '';
      const processableChunks: string[] = [];
      
      // Group chunks until reaching max size
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

      // Process chunks in small batches to control concurrency
      const BATCH_SIZE = 2;
      const audioContents: Uint8Array[] = [];
      
      for (let i = 0; i < processableChunks.length; i += BATCH_SIZE) {
        const batchChunks = processableChunks.slice(i, i + BATCH_SIZE);
        console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(processableChunks.length / BATCH_SIZE)}`);
        
        const batchResults = await Promise.all(
          batchChunks.map(async (chunk) => {
            try {
              // Prepare request body
              const requestBody = {
                input: { text: chunk },
                voice: {
                  languageCode: voiceId.split('-').slice(0, 2).join('-'),
                  name: voiceId
                },
                audioConfig: {
                  audioEncoding: 'MP3',
                  speakingRate: 1.0,
                  pitch: 0.0,
                  sampleRateHertz: 24000
                }
              };

              // Call Google TTS API
              const response = await fetch(
                'https://texttospeech.googleapis.com/v1/text:synthesize',
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(requestBody),
                }
              );

              if (!response.ok) {
                throw new Error(`Google TTS API error: ${response.status} ${response.statusText}`);
              }

              const result = await response.json();
              
              // Convert base64 to Uint8Array
              const binaryString = atob(result.audioContent);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }

              // Update progress
              processedCharacters += chunk.length;
              const progress = Math.min(
                Math.round((processedCharacters / totalCharacters) * 90) + 5,
                95
              );

              console.log(`📊 Progress update: ${progress}% (${processedCharacters}/${totalCharacters} characters)`);

              // Update database progress
              await supabaseClient
                .rpc('increment_processed_characters', {
                  p_conversion_id: conversionId,
                  p_increment: chunk.length,
                  p_progress: progress,
                  p_total_characters: totalCharacters,
                  p_processed_chunks: i + batchChunks.length,
                  p_total_chunks: processableChunks.length
                });

              return bytes;
            } catch (error) {
              console.error(`Error processing chunk:`, error);
              throw error;
            }
          })
        );

        audioContents.push(...batchResults);
      }

      clearTimeout(timeout);

      if (!audioContents || audioContents.length === 0) {
        throw new Error('No audio content generated from chunks');
      }
      
      // Combine audio chunks
      console.log('🔄 Combining audio chunks');
      const combinedAudioContent = await combineAudioChunks(audioContents);
      
      if (!combinedAudioContent) {
        throw new Error('Failed to combine audio chunks');
      }

      // Convert to base64 for response
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
      
      // Update error status
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
