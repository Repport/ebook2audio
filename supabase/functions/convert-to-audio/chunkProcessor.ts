
import { synthesizeSpeech } from './speech-service.ts';

export async function combineAudioChunks(audioChunks: Uint8Array[]): Promise<ArrayBuffer> {
  // Calculate total length
  const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
  
  // Create a new Uint8Array with the total size
  const combinedArray = new Uint8Array(totalLength);
  
  // Copy each chunk into the combined array
  let offset = 0;
  for (const chunk of audioChunks) {
    combinedArray.set(chunk, offset);
    offset += chunk.byteLength;
  }
  
  return combinedArray.buffer;
}

export async function processTextInChunks(
  text: string,
  voiceId: string,
  accessToken: string
): Promise<string> {
  // Normalize text before processing
  console.log(`🎯 Processing text chunk of length ${text.length}`);
  
  try {
    // Intentar generar audio con reintentos
    const audioContent = await retry(
      async () => {
        const content = await synthesizeSpeech(text, voiceId, accessToken);
        if (!content) {
          throw new Error('No audio content generated');
        }
        return content;
      },
      3,
      1000,
      (attempt) => console.log(`📝 Attempt ${attempt} to generate audio`)
    );
    
    console.log('✅ Successfully processed text chunk');
    return audioContent;
    
  } catch (error) {
    console.error('❌ Error processing text chunk:', error);
    throw error;
  }
}

async function retry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000,
  onAttempt?: (attempt: number) => void
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      onAttempt?.(attempt + 1);
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Attempt ${attempt + 1}/${retries} failed:`, error.message);
      
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError!;
}
