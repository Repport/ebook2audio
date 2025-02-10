
import { supabase } from "@/integrations/supabase/client";
import { createConversion, updateConversionStatus } from "./conversion/conversionManager";
import { createChunksForConversion, updateChunkStatus, getConversionChunks } from "./conversion/chunkManager";
import { generateHash } from "./conversion/utils";
import { ChapterWithTimestamp } from "./conversion/types";

const MAX_CONCURRENT_REQUESTS = 8;

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
      // Create chunks if they don't exist
      console.log('Fetching existing chunks...');
      const existingChunks = await getConversionChunks(conversionId);
      let chunks = existingChunks;
      
      if (chunks.length === 0) {
        console.log('No existing chunks found, creating new chunks...');
        chunks = await createChunksForConversion(conversionId, text);
        console.log(`Created ${chunks.length} chunks`);
      }

      const totalChunks = chunks.length;
      let completedChunks = chunks.filter(c => c.status === 'completed').length;

      // Update initial progress
      if (onProgressUpdate) {
        onProgressUpdate(
          Math.round((completedChunks / totalChunks) * 100),
          totalChunks,
          completedChunks
        );
      }

      // Process chunks in parallel with limited concurrency
      const pendingChunks = chunks.filter(c => c.status !== 'completed');
      console.log(`Processing ${pendingChunks.length} pending chunks...`);
      
      const results: ArrayBuffer[] = new Array(totalChunks);

      // Fill in completed chunks
      chunks.forEach((chunk, index) => {
        if (chunk.status === 'completed' && chunk.audio_path) {
          results[index] = new ArrayBuffer(0); // Placeholder for completed chunks
        }
      });

      await updateConversionStatus(conversionId, 'processing');

      // Process remaining chunks
      for (let i = 0; i < pendingChunks.length; i += MAX_CONCURRENT_REQUESTS) {
        console.log(`Processing batch ${Math.floor(i / MAX_CONCURRENT_REQUESTS) + 1}...`);
        const batch = pendingChunks.slice(i, i + MAX_CONCURRENT_REQUESTS);
        const promises = batch.map(async (chunk) => {
          try {
            console.log(`Processing chunk ${chunk.chunk_index + 1}/${totalChunks}`);
            await updateChunkStatus(chunk.id, 'processing');

            const response = await supabase.functions.invoke<{ data: { audioContent: string } }>(
              'convert-to-audio',
              {
                body: {
                  text: chunk.content,
                  voiceId,
                  fileName,
                  isChunk: true,
                  chunkIndex: chunk.chunk_index
                }
              }
            );

            if (!response.data?.data?.audioContent) {
              console.error('Edge function response:', response);
              throw new Error('No audio content received');
            }

            // Convert base64 to ArrayBuffer
            const binaryString = atob(response.data.data.audioContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const audioBuffer = bytes.buffer;
            
            results[chunk.chunk_index] = audioBuffer;

            await updateChunkStatus(chunk.id, 'completed', `chunks/${conversionId}/${chunk.id}.mp3`);
            completedChunks++;

            if (onProgressUpdate) {
              onProgressUpdate(
                Math.round((completedChunks / totalChunks) * 100),
                totalChunks,
                completedChunks
              );
            }

            return audioBuffer;
          } catch (error) {
            console.error(`Error processing chunk ${chunk.id}:`, error);
            await updateChunkStatus(chunk.id, 'failed', undefined, error.message);
            throw error;
          }
        });

        await Promise.all(promises);
      }

      // Combine all chunks
      console.log('Combining audio chunks...');
      const totalSize = results.reduce((acc, buf) => acc + buf.byteLength, 0);
      const combined = new Uint8Array(totalSize);
      let offset = 0;

      results.forEach((buffer) => {
        combined.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
      });

      console.log('Conversion completed successfully');
      await updateConversionStatus(conversionId, 'completed');
      return combined.buffer;

    } catch (error) {
      console.error('Error during conversion:', error);
      await updateConversionStatus(conversionId, 'failed', error.message);
      throw error;
    }

  } catch (error) {
    console.error('Fatal error in convertToAudio:', error);
    throw error;
  }
}
