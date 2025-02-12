
import { synthesizeSpeech } from './speech-service.ts';

export async function processTextInChunks(
  text: string,
  voiceId: string,
  accessToken: string,
  conversionId: string,
  supabaseClient: any,
  updateProgress: (chunk: number) => Promise<void>,
  maxChunkSize: number = 4800 // Aumentado a 4800 para optimizar el número de chunks
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
  chunks.forEach((chunk, i) => {
    console.log(`Chunk ${i + 1} length: ${chunk.length} characters`);
  });

  // Procesar cada chunk
  const audioContents: string[] = [];
  const totalChunks = chunks.length;
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}`);
    const audioContent = await synthesizeSpeech(chunks[i], voiceId, accessToken);
    audioContents.push(audioContent);
    
    // Actualizar el progreso
    await updateProgress(i + 1);
  }

  return { audioContents };
}

export async function combineAudioChunks(audioContents: string[]): Promise<string> {
  // Por ahora simplemente devolvemos el primer chunk mientras implementamos
  // la combinación real de audio
  return audioContents[0];
}
