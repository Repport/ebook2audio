
import { supabase } from "@/integrations/supabase/client";
import { generateHash, splitTextIntoChunks } from "./conversion/utils";
import { createConversion, updateConversionStatus } from "./conversion/conversionManager";
import { ChapterWithTimestamp } from "./conversion/types";

export async function convertToAudio(
  text: string,
  voiceId: string,
  chapters?: ChapterWithTimestamp[],
  fileName?: string,
  onProgressUpdate?: (progress: number, totalChunks: number, completedChunks: number) => void
): Promise<ArrayBuffer> {
  console.log('Starting conversion process with:', {
    textLength: text?.length,
    voiceId,
    hasChapters: !!chapters,
    fileName
  });

  const textHash = await generateHash(text, voiceId);
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  try {
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

      // Update initial progress
      if (onProgressUpdate) {
        onProgressUpdate(
          Math.round((completedChunks / totalChunks) * 100),
          totalChunks,
          completedChunks
        );
      }

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
            console.error('Edge function error:', error);
            throw error;
          }

          if (!data?.data?.audioContent) {
            console.error('Invalid response from edge function:', data);
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

          if (onProgressUpdate) {
            onProgressUpdate(
              Math.round((completedChunks / totalChunks) * 100),
              totalChunks,
              completedChunks
            );
          }

        } catch (error) {
          console.error(`Error processing chunk ${i}:`, error);
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
      return combined.buffer;

    } catch (error) {
      console.error('Error during conversion:', error);
      console.error('Full error stack:', error.stack);
      await updateConversionStatus(conversionId, 'failed', error.message);
      throw error;
    }

  } catch (error) {
    console.error('Fatal error in convertToAudio:', error);
    console.error('Full error stack:', error.stack);
    throw error;
  }
}
