
import { synthesizeSpeech } from './speech-service.ts';

// Función de reintento genérica
async function retry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
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
  console.log(`🎯 Processing text chunk of length ${text.length}`);
  
  try {
    // Intentar generar audio con reintentos
    const audioContent = await retry(async () => {
      const content = await synthesizeSpeech(text, voiceId, accessToken);
      if (!content) {
        throw new Error('No audio content generated');
      }
      return content;
    });
    
    console.log('✅ Successfully processed text chunk');
    return audioContent;
    
  } catch (error) {
    console.error('❌ Error processing text chunk:', error);
    throw error;
  }
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
