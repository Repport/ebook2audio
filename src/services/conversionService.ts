
import { supabase } from "@/integrations/supabase/client";
import { generateHash, splitTextIntoChunks } from "./conversion/utils";
import { createConversion, updateConversionStatus } from "./conversion/conversionManager";
import { ChapterWithTimestamp } from "./conversion/types";

export async function convertToAudio(
  text: string,
  voiceId: string,
  chapters?: ChapterWithTimestamp[],
  fileName?: string,
): Promise<{ audio: ArrayBuffer, id: string }> {
  console.log('Starting conversion process with:', {
    textLength: text?.length,
    voiceId,
    hasChapters: !!chapters,
    fileName
  });

  const textHash = await generateHash(text, voiceId);
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  try {
    // Check if there's an existing completed conversion
    const { data: existingConversion, error: fetchError } = await supabase
      .from('text_conversions')
      .select('storage_path, id')  // Explicitly select storage_path and id
      .eq('text_hash', textHash)
      .eq('status', 'completed')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing conversion:', {
        error: fetchError,
        context: { textHash, fileName }
      });
      throw fetchError;
    }

    if (existingConversion?.storage_path) {
      console.log('Found existing conversion:', existingConversion.storage_path);
      const { data, error } = await supabase.storage
        .from('audio_cache')
        .download(existingConversion.storage_path);

      if (error) {
        console.error('Error downloading existing conversion:', {
          error,
          context: { storagePath: existingConversion.storage_path }
        });
        throw error;
      }

      if (data) {
        return { 
          audio: await data.arrayBuffer(),
          id: existingConversion.id
        };
      }
    }

    // Create or get existing conversion
    console.log('Creating conversion record...');
    const conversionId = await createConversion(textHash, fileName, userId);
    console.log('Created conversion with ID:', conversionId);
    
    try {
      // Split text into chunks
      console.log('Splitting text into chunks...');
      const chunks = splitTextIntoChunks(text);
      console.log(`Created ${chunks.length} chunks`);

      const totalChunks = chunks.length;
      let completedChunks = 0;

      await updateConversionStatus(conversionId, 'processing');

      console.log('Starting chunk processing...');
      const audioBuffers: ArrayBuffer[] = [];

      // Process chunks sequentially to maintain order
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Processing chunk ${i + 1}/${chunks.length}`);

        try {
          console.log('Invoking convert-to-audio function with params:', {
            chunkIndex: i,
            contentLength: chunk.length,
            voiceId
          });

          const { data, error } = await supabase.functions.invoke<{ data: { audioContent: string } }>(
            'convert-to-audio',
            {
              body: {
                text: chunk,
                voiceId,
                fileName,
                isChunk: true,
                chunkIndex: i
              }
            }
          );

          if (error) {
            console.error('Edge function error:', {
              error,
              context: { chunkIndex: i, conversionId }
            });
            throw error;
          }

          if (!data?.data?.audioContent) {
            console.error('Invalid response from edge function:', {
              response: data,
              context: { chunkIndex: i, conversionId }
            });
            throw new Error('No audio content received from conversion');
          }

          // Convert base64 to ArrayBuffer
          const binaryString = atob(data.data.audioContent);
          const bytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }
          
          audioBuffers[i] = bytes.buffer;
          completedChunks++;

          // Update conversion progress
          const currentProgress = Math.round((completedChunks / totalChunks) * 100);
          await updateConversionStatus(conversionId, 'processing', undefined, currentProgress);

        } catch (error) {
          console.error(`Error processing chunk ${i}:`, {
            error,
            context: { chunkIndex: i, conversionId }
          });
          await updateConversionStatus(conversionId, 'failed', error.message);
          throw error;
        }
      }

      console.log('All chunks processed successfully');

      // Combine all audio buffers
      const totalSize = audioBuffers.reduce((acc, buf) => acc + buf.byteLength, 0);
      const combined = new Uint8Array(totalSize);
      let offset = 0;

      audioBuffers.forEach((buffer) => {
        combined.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
      });

      console.log('Conversion completed successfully');
      await updateConversionStatus(conversionId, 'completed');
      return { 
        audio: combined.buffer,
        id: conversionId
      };

    } catch (error) {
      console.error('Error during conversion:', {
        error,
        context: { conversionId, fileName }
      });
      await updateConversionStatus(conversionId, 'failed', error.message);
      throw error;
    }

  } catch (error) {
    console.error('Fatal error in convertToAudio:', {
      error,
      stack: error.stack,
      context: { fileName, textLength: text?.length }
    });
    throw error;
  }
}
