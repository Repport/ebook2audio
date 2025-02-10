
import { supabase } from "@/integrations/supabase/client";
import { generateHash } from "./utils";
import { createConversion, updateConversionStatus } from "./conversionManager";
import { ChapterWithTimestamp } from "./types";
import { uploadToStorage } from "./storage/cacheStorage";

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
    // Create or get existing conversion
    console.log('Creating conversion record...');
    const conversionId = await createConversion(textHash, fileName, userId);
    console.log('Created conversion with ID:', conversionId);
    
    try {
      await updateConversionStatus(conversionId, 'processing');

      const audioBuffer = await processConversionChunks(text, voiceId, fileName, conversionId);
      
      // Save the final combined audio to storage
      const storagePath = `${userId}/${conversionId}.mp3`;
      const { error: uploadError } = await uploadToStorage(storagePath, audioBuffer);

      if (uploadError) {
        console.error('Error uploading final audio:', uploadError);
        throw uploadError;
      }

      // Update the conversion record with the storage path
      const { error: updateError } = await supabase
        .from('text_conversions')
        .update({ storage_path: storagePath })
        .eq('id', conversionId);

      if (updateError) {
        console.error('Error updating storage path:', updateError);
        throw updateError;
      }

      console.log('Conversion completed successfully');
      await updateConversionStatus(conversionId, 'completed');
      
      return { 
        audio: audioBuffer,
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

async function processConversionChunks(
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

function splitTextIntoChunks(text: string): string[] {
  const chunkSize = 5000;
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (let word of words) {
    const wordLength = word.length;
    const spaceLength = currentChunk.length > 0 ? 1 : 0;
    const potentialLength = currentLength + wordLength + spaceLength;

    if (potentialLength > chunkSize && currentChunk.length > 0) {
      const chunk = currentChunk.join(" ").trim();
      if (chunk) {
        chunks.push(chunk);
      }
      currentChunk = [word];
      currentLength = wordLength;
    } else {
      currentChunk.push(word);
      currentLength = potentialLength;
    }
  }

  if (currentChunk.length > 0) {
    const finalChunk = currentChunk.join(" ").trim();
    if (finalChunk) {
      chunks.push(finalChunk);
    }
  }

  return chunks.filter(chunk => chunk.trim().length > 0);
}

