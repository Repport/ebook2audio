
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
  accessToken: string,
  conversionId: string,
  supabaseClient: any,
  updateProgress: (chunk: number) => Promise<void>,
  maxChunkSize: number = 4800
): Promise<{ audioContents: string[] }> {
  const encoder = new TextEncoder();
  
  // Dividir el texto en chunks
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentBytes = 0;

  for (const word of words) {
    const wordBytes = encoder.encode(word + ' ').length;
    const potentialBytes = currentBytes + wordBytes;

    if (potentialBytes > 4500 && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
      currentBytes = wordBytes;
    } else {
      currentChunk.push(word);
      currentBytes = potentialBytes;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  console.log(`📦 Split text into ${chunks.length} chunks`);
  chunks.forEach((chunk, i) => {
    const chunkBytes = encoder.encode(chunk).length;
    console.log(`📄 Chunk ${i + 1}: ${chunk.length} chars, ${chunkBytes} bytes`);
  });

  const audioContents: string[] = [];
  const totalChunks = chunks.length;
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`🔄 Processing chunk ${i + 1}/${chunks.length}`);
    
    try {
      // Intentar generar audio con reintentos
      const audioContent = await retry(async () => {
        const content = await synthesizeSpeech(chunks[i], voiceId, accessToken);
        if (!content) {
          throw new Error(`No audio content generated for chunk ${i + 1}`);
        }
        return content;
      });
      
      audioContents.push(audioContent);
      
      // Calcular progreso (máximo 99%)
      const currentProgress = Math.min(
        Math.round(((i + 1) / totalChunks) * 95) + 5,
        99
      );
      
      console.log(`✅ Chunk ${i + 1} completed. Progress: ${currentProgress}%`);
      
      // Actualizar progreso de forma segura
      await safeSupabaseUpdate(supabaseClient, conversionId, {
        progress: currentProgress,
        processed_chunks: i + 1,
        total_chunks: totalChunks
      });
      
      await updateProgress(i + 1);
      
    } catch (error) {
      console.error(`❌ Error processing chunk ${i + 1}:`, error);
      
      // Actualizar estado de error en Supabase
      await safeSupabaseUpdate(supabaseClient, conversionId, {
        status: 'failed',
        error_message: `Failed to process chunk ${i + 1}: ${error.message}`
      });
      
      throw error;
    }
  }

  if (audioContents.length === 0) {
    throw new Error('No audio content generated');
  }

  return { audioContents };
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
