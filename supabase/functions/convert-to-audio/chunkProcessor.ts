
import { synthesizeSpeech } from './speech-service.ts';
import { retry } from './utils.ts';

export async function processTextInChunks(text: string, voiceId: string, accessToken: string) {
  const maxRetries = 3;
  const baseDelay = 1000;

  // Asegurarse de que el texto no exceda el límite
  if (text.length > 4800) {
    throw new Error(`Text exceeds maximum length of 4800 characters (current: ${text.length})`);
  }

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
