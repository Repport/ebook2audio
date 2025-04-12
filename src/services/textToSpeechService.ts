
import { supabase } from "@/integrations/supabase/client";
import { ConversionProgress, ConversionResult } from "@/types/conversion";

type ProgressCallback = (progress: ConversionProgress) => void;

/**
 * Converts text to speech using the API
 */
export async function convertTextToSpeech(
  text: string,
  voiceId: string,
  onProgress?: ProgressCallback
): Promise<ConversionResult> {
  // Initial progress update
  onProgress?.({ progress: 1 });
  
  try {
    console.log(`Starting text-to-speech conversion for text of length ${text.length}`);
    
    // Split large text into chunks if needed (over 4000 characters)
    const chunks = text.length > 4000 ? splitTextIntoChunks(text) : [text];
    const totalChunks = chunks.length;
    
    // Update progress with chunk information
    onProgress?.({ 
      progress: 5, 
      processedChunks: 0, 
      totalChunks,
      processedCharacters: 0,
      totalCharacters: text.length
    });
    
    if (chunks.length > 1) {
      console.log(`Text was split into ${chunks.length} chunks for processing`);
    }
    
    // Process each chunk
    const audioBuffers: ArrayBuffer[] = [];
    let processedChunks = 0;
    let processedCharacters = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Update progress
      onProgress?.({
        progress: Math.floor(5 + (i / totalChunks) * 90),
        processedChunks,
        totalChunks,
        processedCharacters,
        totalCharacters: text.length,
        currentChunk: chunk.substring(0, 50) + "..."
      });
      
      // Call the edge function to convert this chunk
      const response = await supabase.functions.invoke('text-to-speech', {
        body: { text: chunk, voiceId }
      });
      
      if (response.error) {
        throw new Error(`Error converting chunk ${i+1}: ${response.error.message}`);
      }
      
      // Decode the base64 audio content
      const audioContent = response.data?.audioContent;
      if (!audioContent) {
        throw new Error(`No audio content received for chunk ${i+1}`);
      }
      
      const audioBuffer = decodeBase64ToArrayBuffer(audioContent);
      audioBuffers.push(audioBuffer);
      
      // Update progress
      processedChunks++;
      processedCharacters += chunk.length;
      
      onProgress?.({
        progress: Math.floor(5 + (processedChunks / totalChunks) * 90),
        processedChunks,
        totalChunks,
        processedCharacters,
        totalCharacters: text.length,
        currentChunk: i < chunks.length - 1 ? chunks[i+1].substring(0, 50) + "..." : ""
      });
    }
    
    // Combine all audio buffers
    const finalAudioBuffer = combineAudioBuffers(audioBuffers);
    
    // Final progress update
    onProgress?.({ progress: 100 });
    
    console.log(`Completed text-to-speech conversion, audio size: ${finalAudioBuffer.byteLength} bytes`);
    
    // Generate a unique ID for this conversion
    const id = generateUniqueId();
    
    return { audio: finalAudioBuffer, id };
  } catch (error) {
    console.error('Text-to-speech conversion error:', error);
    onProgress?.({ 
      progress: 0, 
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Splits text into smaller chunks
 */
function splitTextIntoChunks(text: string, chunkSize = 4000): string[] {
  const chunks: string[] = [];
  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    // Find a good break point - preferably at the end of a sentence
    let breakPoint = Math.min(currentIndex + chunkSize, text.length);
    
    if (breakPoint < text.length) {
      // Try to find a sentence end (., !, ?)
      const sentenceEnd = text.lastIndexOf('.', breakPoint);
      const exclamationEnd = text.lastIndexOf('!', breakPoint);
      const questionEnd = text.lastIndexOf('?', breakPoint);
      
      // Find the closest sentence end within our range
      const bestSentenceEnd = Math.max(
        sentenceEnd, 
        exclamationEnd, 
        questionEnd
      );
      
      // If we found a sentence end that's not too far back, use it
      if (bestSentenceEnd > currentIndex && bestSentenceEnd > breakPoint - 200) {
        breakPoint = bestSentenceEnd + 1; // Include the punctuation
      }
    }
    
    chunks.push(text.substring(currentIndex, breakPoint));
    currentIndex = breakPoint;
  }
  
  return chunks;
}

/**
 * Decodes a base64 string to an ArrayBuffer
 */
function decodeBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Combines multiple ArrayBuffers into a single ArrayBuffer
 */
function combineAudioBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  // If there's only one buffer, return it directly
  if (buffers.length === 1) {
    return buffers[0];
  }
  
  // Calculate the total length
  const totalLength = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  
  // Create a new buffer of the total size
  const combined = new Uint8Array(totalLength);
  
  // Copy each buffer into the combined buffer
  let position = 0;
  for (const buffer of buffers) {
    combined.set(new Uint8Array(buffer), position);
    position += buffer.byteLength;
  }
  
  return combined.buffer;
}

/**
 * Generates a unique ID for a conversion
 */
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
