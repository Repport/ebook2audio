
import { convertTextToAudio } from './audio/conversionService';
import { TextChunkCallback } from './types/chunks';

// Número máximo de reintentos
const MAX_RETRIES = 2;

/**
 * Función principal para convertir texto a audio
 * @param text Texto a convertir
 * @param voiceId ID de la voz a utilizar
 * @param onProgress Callback para reportar progreso
 * @returns Promise<{ audio: ArrayBuffer, id: string }>
 */
export const convertToAudio = async (
  text: string, 
  voiceId: string,
  onProgress?: TextChunkCallback
): Promise<{ audio: ArrayBuffer; id: string }> => {
  console.log('convertToAudio - Starting conversion');
  
  // Validar parámetros de entrada
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('El texto para convertir no puede estar vacío');
  }
  
  if (!voiceId || typeof voiceId !== 'string') {
    throw new Error('Se requiere un ID de voz válido');
  }
  
  let lastError;
  
  // Implementar reintentos para mayor robustez
  for (let retry = 0; retry <= MAX_RETRIES; retry++) {
    try {
      if (retry > 0) {
        console.log(`convertToAudio - Retry attempt ${retry}/${MAX_RETRIES}`);
      }
      
      // Intentar la conversión
      const result = await convertTextToAudio(text, voiceId, onProgress);
      
      // Validar resultado
      if (!result || !result.audio) {
        throw new Error('No se recibieron datos de audio válidos');
      }
      
      console.log('convertToAudio - Conversion completed successfully');
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`convertToAudio - Error on attempt ${retry + 1}/${MAX_RETRIES + 1}:`, error);
      
      // Solo reintentamos si no es el último intento
      if (retry < MAX_RETRIES) {
        // Esperar un poco más entre cada reintento (backoff exponencial)
        const delay = Math.pow(2, retry) * 1000;
        console.log(`convertToAudio - Waiting ${delay}ms before next attempt`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  throw lastError || new Error('La conversión falló después de múltiples intentos');
};
