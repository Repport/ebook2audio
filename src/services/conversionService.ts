
import { supabase } from "@/integrations/supabase/client";
import { Chapter } from "@/utils/textExtraction";

interface ChapterWithTimestamp extends Chapter {
  timestamp: number;
}

// Simple XOR-based obfuscation
function obfuscateData(data: string): string {
  const key = 'epub2audio';
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// Generate hash for text content using Web Crypto API
async function generateHash(text: string, voiceId: string): Promise<string> {
  const data = `${text}-${voiceId}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Split text into chunks of appropriate size
function splitTextIntoChunks(text: string, maxChunkSize = 5000): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  const sentences = text.split(/([.!?]+\s)/);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

export const convertToAudio = async (
  text: string, 
  voiceId: string,
  chapters?: ChapterWithTimestamp[],
  fileName?: string,
  onProgressUpdate?: (progress: number) => void
): Promise<ArrayBuffer> => {
  if (text.startsWith('%PDF')) {
    console.error('Received raw PDF data instead of text content');
    throw new Error('Invalid text content: Raw PDF data received. Please check PDF text extraction.');
  }

  const MAX_TEXT_SIZE = 30 * 1024 * 1024;
  if (text.length > MAX_TEXT_SIZE) {
    throw new Error(`Text content is too large (${(text.length / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${MAX_TEXT_SIZE / (1024 * 1024)}MB.`);
  }

  console.log('Converting text length:', text.length, 'with voice:', voiceId);
  console.log('Chapters:', chapters?.length || 0);

  const textHash = await generateHash(text, voiceId);

  // Check cache first
  const { data: existingConversion } = await supabase
    .from('text_conversions')
    .select('*')
    .eq('text_hash', textHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existingConversion?.storage_path) {
    console.log('Found cached conversion, fetching from storage');
    if (onProgressUpdate) {
      onProgressUpdate(100);
    }
    const { data: audioData, error: downloadError } = await supabase.storage
      .from('audio_cache')
      .download(existingConversion.storage_path);

    if (downloadError) {
      console.error('Error downloading cached audio:', downloadError);
      throw downloadError;
    }

    return await audioData.arrayBuffer();
  }

  // Split text into chunks for parallel processing
  const textChunks = splitTextIntoChunks(text);
  console.log(`Split text into ${textChunks.length} chunks for parallel processing`);

  const MAX_CONCURRENT_REQUESTS = 3;
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  // Process chunks in parallel with controlled concurrency
  const processChunksBatch = async (chunks: string[], startIndex: number): Promise<ArrayBuffer[]> => {
    const results: ArrayBuffer[] = new Array(chunks.length);
    const processing = new Set<number>();
    let completed = 0;

    const processChunk = async (index: number): Promise<void> => {
      if (index >= chunks.length) return;

      processing.add(index);
      let retryCount = 0;

      while (retryCount <= MAX_RETRIES) {
        try {
          const obfuscatedText = obfuscateData(chunks[index]);
          const obfuscatedVoiceId = obfuscateData(voiceId);

          const response = await supabase.functions.invoke('convert-to-audio', {
            body: { 
              text: obfuscatedText, 
              voiceId: obfuscatedVoiceId,
              fileName: `chunk_${index}`,
              isChunk: true
            }
          });

          if (response.error) throw response.error;

          const { data } = response;
          if (!data?.audioContent) throw new Error('No audio content received');

          // Convert base64 to ArrayBuffer
          const binaryString = atob(data.audioContent);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          results[index] = bytes.buffer;
          completed++;

          if (onProgressUpdate) {
            const progress = Math.round((completed / chunks.length) * 100);
            onProgressUpdate(progress);
          }

          processing.delete(index);
          
          // Process next chunk if available
          const nextIndex = Math.max(...Array.from(processing)) + 1;
          if (nextIndex < chunks.length && !processing.has(nextIndex)) {
            processChunk(nextIndex);
          }

          return;
        } catch (error) {
          console.error(`Error processing chunk ${index}, attempt ${retryCount + 1}:`, error);
          retryCount++;

          if (retryCount <= MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
          } else {
            throw error;
          }
        }
      }
    };

    // Start initial batch of concurrent requests
    const initialBatch = Math.min(MAX_CONCURRENT_REQUESTS, chunks.length);
    await Promise.all(
      Array.from({ length: initialBatch }, (_, i) => processChunk(startIndex + i))
    );

    // Wait for all chunks to complete
    while (completed < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  };

  try {
    // Process all chunks
    const audioChunks = await processChunksBatch(textChunks, 0);

    // Combine all audio chunks
    const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    const combinedBuffer = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of audioChunks) {
      combinedBuffer.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    // Store in cache
    const storagePath = `${textHash}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('audio_cache')
      .upload(storagePath, combinedBuffer.buffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      throw uploadError;
    }

    // Store conversion record
    const { error: insertError } = await supabase
      .from('text_conversions')
      .insert({
        text_hash: textHash,
        storage_path: storagePath,
        file_name: fileName,
        file_size: combinedBuffer.length
      });

    if (insertError) {
      console.error('Error storing conversion:', insertError);
    }

    if (onProgressUpdate) {
      onProgressUpdate(100);
    }

    return combinedBuffer.buffer;
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
};
