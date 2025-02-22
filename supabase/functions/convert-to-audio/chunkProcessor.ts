
import { synthesizeSpeech } from './speech-service.ts';
import { retry, validateChunk } from './utils.ts';

export async function processTextInChunks(text: string, voiceId: string, accessToken: string) {
  const maxRetries = 3;
  const baseDelay = 1000;

  // Validar el chunk individual
  validateChunk(text);

  // Procesar el chunk con reintentos
  return await retry(
    async () => {
      return await synthesizeSpeech(text, voiceId, accessToken);
    },
    maxRetries,
    baseDelay,
    'Chunk processing'
  );
}
