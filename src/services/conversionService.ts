
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
  const textHash = await generateHash(text, voiceId);
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  // Create or get existing conversion
  const conversionId = await createConversion(textHash, fileName, userId);
  
  try {
    // Create chunks if they don't exist
    const existingChunks = await getConversionChunks(conversionId);
    let chunks = existingChunks;
    
    if (chunks.length === 0) {
      chunks = await createChunksForConversion(conversionId, text);
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
      const batch = pendingChunks.slice(i, i + MAX_CONCURRENT_REQUESTS);
      const promises = batch.map(async (chunk) => {
        try {
          await updateChunkStatus(chunk.id, 'processing');

          const { data, error } = await supabase.functions.invoke<{ data: { audioContent: string } }>(
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

          if (error || !data?.data?.audioContent) {
            throw error || new Error('No audio content received');
          }

          const audioBuffer = Buffer.from(data.data.audioContent, 'base64');
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
    const totalSize = results.reduce((acc, buf) => acc + buf.byteLength, 0);
    const combined = new Uint8Array(totalSize);
    let offset = 0;

    results.forEach((buffer) => {
      combined.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    });

    await updateConversionStatus(conversionId, 'completed');
    return combined.buffer;

  } catch (error) {
    await updateConversionStatus(conversionId, 'failed', error.message);
    throw error;
  }
}
