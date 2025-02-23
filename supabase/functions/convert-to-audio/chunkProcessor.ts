
import { synthesizeSpeech } from './speech-service.ts';
import { retry, validateChunk } from './utils.ts';

export async function processTextInChunks(text: string, voiceId: string, accessToken: string) {
  const maxRetries = 3;
  const baseDelay = 1000;

  try {
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
  } catch (error) {
    console.error('Error processing chunk:', error);
    throw error;
  }
}
