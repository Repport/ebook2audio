/**
 * Utility functions for text conversion and hashing
 */

/**
 * Generates a hash for text content using Web Crypto API
 * Only uses the first 1000 characters to ensure consistent hashing
 */
export async function generateHash(text: string, voiceId: string): Promise<string> {
  // Normalize text by trimming and converting to lowercase
  const normalizedText = text.trim().toLowerCase();
  // Take first 1000 chars to ensure consistent hashing
  const truncatedText = normalizedText.slice(0, 1000);
  const data = `${truncatedText}-${voiceId}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate optimal chunk size based on total text length
 */
export function calculateOptimalChunkSize(totalLength: number): number {
  // Google TTS tiene un límite de 5000 caracteres
  const maxChunkSize = 4800; // Dejar un margen de seguridad
  
  // Para textos muy pequeños, usar el texto completo
  if (totalLength <= maxChunkSize) {
    return totalLength;
  }
  
  return maxChunkSize;
}

/**
 * Split text into smaller chunks with better word boundary handling
 */
export function splitTextIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  const optimalChunkSize = calculateOptimalChunkSize(text.length);
  
  // Primero dividimos por párrafos para mantener la coherencia
  const paragraphs = text.split(/\n+/);
  
  let currentChunk: string[] = [];
  let currentLength = 0;

  console.log(`Total text length: ${text.length}, Using chunk size: ${optimalChunkSize}`);

  for (const paragraph of paragraphs) {
    // Dividir párrafo en oraciones
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
      const sentenceLength = sentence.trim().length;
      const spaceLength = currentChunk.length > 0 ? 1 : 0;
      const potentialLength = currentLength + sentenceLength + spaceLength;

      if (potentialLength > optimalChunkSize && currentChunk.length > 0) {
        const chunk = currentChunk.join(" ").trim();
        if (chunk) {
          chunks.push(chunk);
          console.log(`Created chunk ${chunks.length}, size: ${chunk.length} characters`);
        }
        currentChunk = [sentence.trim()];
        currentLength = sentenceLength;
      } else {
        currentChunk.push(sentence.trim());
        currentLength = potentialLength;
      }
    }
    
    // Añadir salto de párrafo si no estamos en el límite del chunk
    if (currentLength + 2 <= optimalChunkSize) {
      currentChunk.push("\n\n");
      currentLength += 2;
    }
  }

  // Añadir el último chunk si hay texto restante
  if (currentChunk.length > 0) {
    const finalChunk = currentChunk.join(" ").trim();
    if (finalChunk) {
      chunks.push(finalChunk);
      console.log(`Created final chunk ${chunks.length}, size: ${finalChunk.length} characters`);
    }
  }

  // Log información de chunks para debugging
  chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1}/${chunks.length}, size: ${chunk.length} characters`);
  });

  return chunks.filter(chunk => chunk.trim().length > 0);
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  { maxRetries = 3, baseDelay = 1000, operation: operationName = 'Operation' } = {}
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`${operationName} attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying ${operationName} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}
