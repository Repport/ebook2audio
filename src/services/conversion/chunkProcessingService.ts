
import { supabase } from "@/integrations/supabase/client";
import { splitTextIntoChunks } from "./utils";
import { updateConversionStatus } from "./conversionManager";

export async function processConversionChunks(
  text: string,
  voiceId: string,
  fileName: string | undefined,
  conversionId: string
): Promise<ArrayBuffer> {
  // Split text into chunks
  console.log('Splitting text into chunks...');
  const chunks = splitTextIntoChunks(text);
  console.log(`Created ${chunks.length} chunks`);

  const totalChunks = chunks.length;
  let completedChunks = 0;
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

  return combined.buffer;
}
