
import { supabase } from "@/integrations/supabase/client";
import { retryOperation } from "../utils";

const MAX_RETRIES_PER_CHUNK = 5;

/**
 * Procesa un chunk de texto y lo convierte en audio
 */
export async function processChunk(
  chunk: string, 
  index: number,
  voiceId: string,
  totalChunks: number
): Promise<ArrayBuffer> {
  console.log(`Processing chunk ${index + 1}/${totalChunks}, size: ${chunk.length} characters`);
  
  if (!chunk.trim()) {
    console.warn(`Empty chunk detected at index ${index}, using placeholder audio`);
    // En lugar de saltar, generamos un silencio breve para mantener continuidad
    const silencePlaceholder = new Uint8Array([
      0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    return silencePlaceholder.buffer;
  }

  const requestBody = {
    text: chunk,
    voiceId: voiceId,
    chunkIndex: index,
    totalChunks: totalChunks
  };
  
  // Incrementamos el número de reintentos y añadimos backoff exponencial
  const response = await retryOperation(
    () => supabase.functions.invoke('convert-to-audio', { body: requestBody }),
    { 
      maxRetries: MAX_RETRIES_PER_CHUNK, 
      baseDelay: 1000,  
      operation: `Convert chunk ${index + 1}`
    }
  );

  if (response.error) {
    console.error(`Edge function error for chunk ${index + 1} after multiple retries:`, response.error);
    throw new Error(`Error crítico en chunk ${index + 1}: ${response.error.message}`);
  }

  if (!response.data) {
    console.error(`Empty response for chunk ${index + 1} after multiple retries:`, response);
    throw new Error(`No se recibieron datos del edge function para el chunk ${index + 1}`);
  }

  const { data } = response;

  if (!data.audioContent) {
    console.error(`Missing audioContent for chunk ${index + 1} after multiple retries:`, data);
    throw new Error(`Contenido de audio ausente para el chunk ${index + 1}`);
  }

  try {
    console.log(`Processing audio data for chunk ${index + 1}, length: ${data.audioContent.length}`);
    const binaryString = atob(data.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let j = 0; j < binaryString.length; j++) {
      bytes[j] = binaryString.charCodeAt(j);
    }
    
    // Verificación para asegurar que el buffer no esté vacío
    if (bytes.length === 0) {
      throw new Error(`El buffer de audio del chunk ${index + 1} está vacío`);
    }
    
    return bytes.buffer;
  } catch (error: any) {
    console.error(`Base64 conversion error for chunk ${index + 1}:`, error);
    throw new Error(`Error al procesar los datos de audio para el chunk ${index + 1}: ${error.message}`);
  }
}
