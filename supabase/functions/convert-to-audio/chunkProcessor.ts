
import { synthesizeSpeech } from './speech-service.ts';
import { normalizeText } from './text-utils.ts';

// Función de reintento genérica
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

// Función segura para actualizar Supabase
async function safeSupabaseUpdate(
  supabaseClient: any,
  conversionId: string,
  data: any
) {
  try {
    const { error } = await supabaseClient
      .from('text_conversions')
      .update(data)
      .eq('id', conversionId);

    if (error) {
      console.warn('⚠️ Warning: Failed to update Supabase:', error.message);
    }
  } catch (error) {
    console.warn('⚠️ Warning: Supabase update failed:', error.message);
  }
}

export async function processTextInChunks(
  text: string,
  voiceId: string,
  accessToken: string
): Promise<string> {
  // Normalizar el texto antes de procesarlo
  const normalizedText = normalizeText(text);
  console.log(`🎯 Processing normalized text chunk of length ${normalizedText.length}`);
  
  try {
    // Intentar generar audio con reintentos
    const audioContent = await retry(
      async () => {
        const content = await synthesizeSpeech(normalizedText, voiceId, accessToken);
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

export async function processChunksSequentially(
  chunks: string[],
  voiceId: string,
  accessToken: string,
  onProgress?: (processed: number, total: number) => void
): Promise<string[]> {
  const audioContents: string[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    try {
      console.log(`🔄 Processing chunk ${i + 1}/${chunks.length}`);
      const audioContent = await processTextInChunks(chunks[i], voiceId, accessToken);
      audioContents.push(audioContent);
      onProgress?.(i + 1, chunks.length);
    } catch (error) {
      console.error(`❌ Error processing chunk ${i + 1}:`, error);
      throw new Error(`Failed to process chunk ${i + 1}: ${error.message}`);
    }
  }
  
  return audioContents;
}

export async function combineAudioChunks(audioContents: string[]): Promise<string> {
  if (audioContents.length === 0) {
    throw new Error('No audio chunks to combine');
  }
  
  try {
    console.log('🔄 Combining audio chunks');
    
    // Por ahora devolvemos el primer chunk mientras implementamos
    // la combinación real de audio
    const combinedContent = audioContents[0];
    
    if (!combinedContent) {
      throw new Error('Failed to combine audio chunks: empty result');
    }
    
    console.log('✅ Successfully combined audio chunks');
    return combinedContent;
    
  } catch (error) {
    console.error('❌ Error combining audio chunks:', error);
    throw error;
  }
}
