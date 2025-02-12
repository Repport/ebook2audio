
import { synthesizeSpeech } from './speech-service.ts';

export async function processTextInChunks(
  text: string,
  voiceId: string,
  accessToken: string,
  maxChunkSize: number = 4800 // Dejamos margen para caracteres especiales
): Promise<string[]> {
  // Dividir el texto en chunks respetando palabras completas
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    const newLength = currentLength + word.length + (currentChunk.length > 0 ? 1 : 0);
    
    if (newLength > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
      currentLength = word.length;
    } else {
      currentChunk.push(word);
      currentLength = newLength;
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
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}`);
    const audioContent = await synthesizeSpeech(chunks[i], voiceId, accessToken);
    audioContents.push(audioContent);
  }

  return audioContents;
}

export async function combineAudioChunks(audioContents: string[]): Promise<string> {
  // Por ahora simplemente devolvemos el primer chunk mientras implementamos
  // la combinación real de audio
  return audioContents[0];
}
