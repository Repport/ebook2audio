
import { supabase } from "@/integrations/supabase/client";
import { splitTextIntoChunks } from "./utils";
import { updateConversionStatus } from "./conversionManager";
import { decodeBase64Audio, combineAudioChunks } from "./utils/audioUtils";

const MAX_CONCURRENT_CHUNKS = 5; // Adjust based on testing
const CHUNK_TIMEOUT = 30000; // 30 seconds timeout per chunk

interface AudioResponse {
  data: {
    audioContent: string;
  };
}

async function processChunkWithTimeout(
  chunk: string,
  chunkIndex: number,
  voiceId: string,
  fileName: string | undefined
): Promise<ArrayBuffer> {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Chunk processing timeout')), CHUNK_TIMEOUT);
  });

  try {
    const processPromise = supabase.functions.invoke<AudioResponse>(
      'convert-to-audio',
      {
        body: {
          text: chunk,
          voiceId,
          fileName,
          isChunk: true,
          chunkIndex
        }
      }
    );

    const result = await Promise.race([processPromise, timeoutPromise]);
    if (!result?.data?.data?.audioContent) throw new Error('No audio content received');
    
    return decodeBase64Audio(result.data.data.audioContent);
  } catch (error) {
    if (error.message === 'Chunk processing timeout') {
      console.error(`Chunk ${chunkIndex} timed out after ${CHUNK_TIMEOUT}ms`);
    }
    throw error;
  }
}

async function processChunkBatch(
  chunks: string[],
  startIndex: number,
  voiceId: string,
  fileName: string | undefined,
  conversionId: string,
  totalChunks: number
): Promise<ArrayBuffer[]> {
  const promises = chunks.map((chunk, index) =>
    processChunkWithTimeout(chunk, startIndex + index, voiceId, fileName)
      .then(async (audioBuffer) => {
        const completedChunks = startIndex + index + 1;
        const progress = Math.round((completedChunks / totalChunks) * 100);
        
        // Update conversion progress
        await updateConversionStatus(conversionId, 'processing', undefined, progress);
        
        return audioBuffer;
      })
      .catch(async (error) => {
        console.error(`Error processing chunk ${startIndex + index}:`, error);
        await updateConversionStatus(
          conversionId,
          'failed',
          `Error processing chunk ${startIndex + index}: ${error.message}`
        );
        throw error;
      })
  );

  return Promise.all(promises);
}

export async function processConversionChunks(
  text: string,
  voiceId: string,
  fileName: string | undefined,
  conversionId: string
): Promise<ArrayBuffer> {
  console.log('Starting parallel chunk processing...');
  const chunks = splitTextIntoChunks(text);
  const totalChunks = chunks.length;
  const audioBuffers: ArrayBuffer[] = [];

  // Process chunks in batches of MAX_CONCURRENT_CHUNKS
  for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_CHUNKS) {
    const batchChunks = chunks.slice(i, i + MAX_CONCURRENT_CHUNKS);
    console.log(`Processing batch ${i / MAX_CONCURRENT_CHUNKS + 1}, chunks ${i + 1}-${i + batchChunks.length} of ${totalChunks}`);

    const batchBuffers = await processChunkBatch(
      batchChunks,
      i,
      voiceId,
      fileName,
      conversionId,
      totalChunks
    );

    audioBuffers.push(...batchBuffers);
  }

  console.log('All chunks processed successfully');
  return combineAudioChunks(audioBuffers);
}
