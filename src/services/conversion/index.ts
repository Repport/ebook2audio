
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
): Promise<{ audio: ArrayBuffer, id: string }> => {
  try {
    console.log('Starting conversion with text length:', text.length);
    console.log('Using voice ID:', voiceId);
    
    // Intentar la conversión
    let attempts = 0;
    let result = null;
    
    while (attempts < MAX_RETRIES && !result) {
      try {
        attempts++;
        console.log(`Conversion attempt ${attempts}/${MAX_RETRIES}`);
        
        result = await convertTextToAudio(text, voiceId, onProgress);
        
        if (!result || !result.audio) {
          console.warn(`Attempt ${attempts} failed, no audio data received`);
          result = null;
        }
      } catch (error) {
        console.error(`Conversion attempt ${attempts} failed:`, error);
        
        if (attempts >= MAX_RETRIES) {
          throw error; // Re-throw if this was our last attempt
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
    
    if (!result) {
      throw new Error('Conversion failed after multiple attempts');
    }
    
    console.log('Conversion completed successfully');
    return result;
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
};
