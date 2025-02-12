
import { synthesizeSpeech } from './speech-service.ts';

export async function processTextInChunks(
  text: string,
  voiceId: string,
  accessToken: string,
  conversionId: string,
  supabaseClient: any,
  updateProgress: (chunk: number) => Promise<void>,
  maxChunkSize: number = 4800
): Promise<{ audioContents: string[] }> {
  // Dividir el texto en chunks respetando palabras completas
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    const wordLength = word.length;
    const spaceLength = currentChunk.length > 0 ? 1 : 0;
    const potentialLength = currentLength + wordLength + spaceLength;

    if (potentialLength > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
      currentLength = wordLength;
    } else {
      currentChunk.push(word);
      currentLength = potentialLength;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  console.log(`Split text into ${chunks.length} chunks`);
  console.log('Total text length:', text.length);
  console.log('Chunk sizes:', chunks.map(chunk => chunk.length));

  const audioContents: string[] = [];
  const totalChunks = chunks.length;
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}`);
    
    try {
      const audioContent = await synthesizeSpeech(chunks[i], voiceId, accessToken);
      audioContents.push(audioContent);
      
      // Calcular el progreso actual basado en chunks completados
      const currentProgress = Math.round(((i + 1) / totalChunks) * 85) + 5; // 5-90%
      console.log(`Chunk ${i + 1} completed. Progress: ${currentProgress}%`);
      
      // Actualizar el progreso en la base de datos
      const { error: updateError } = await supabaseClient
        .from('text_conversions')
        .update({ 
          progress: currentProgress,
          processed_chunks: i + 1,
          total_chunks: totalChunks
        })
        .eq('id', conversionId);

      if (updateError) {
        console.error('Error updating progress:', updateError);
      }
      
      await updateProgress(i + 1);
      
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
      throw error;
    }
  }

  // Actualizar al progreso final (90%) antes de la combinación de audio
  await supabaseClient
    .from('text_conversions')
    .update({ 
      progress: 90,
      processed_chunks: totalChunks,
      total_chunks: totalChunks
    })
    .eq('id', conversionId);

  return { audioContents };
}

export async function combineAudioChunks(audioContents: string[]): Promise<string> {
  // Por ahora simplemente devolvemos el primer chunk mientras implementamos
  // la combinación real de audio
  return audioContents[0];
}
