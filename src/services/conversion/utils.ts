
/**
 * Utility functions for text conversion and hashing
 */

/**
 * Generates a hash for text content using Web Crypto API
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
 * Split text into smaller chunks with better word boundary handling
 */
export function splitTextIntoChunks(text: string, maxSize: number = 4800): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  let chunkNumber = 1;
  
  // Primero dividimos por párrafos para mantener la coherencia
  const paragraphs = text.split(/\n+/);
  
  for (const paragraph of paragraphs) {
    // Dividir párrafo en oraciones
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
      const testChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
      
      if (testChunk.length > maxSize && currentChunk) {
        console.log(`Creating chunk ${chunkNumber}, size: ${currentChunk.length} characters`);
        chunks.push(currentChunk);
        currentChunk = sentence;
        chunkNumber++;
      } else {
        currentChunk = testChunk;
      }
    }
    
    // Añadir salto de párrafo si no estamos en el límite del chunk
    if (currentChunk.length + 2 <= maxSize) {
      currentChunk += '\n\n';
    }
  }
  
  // Añadir el último chunk si hay contenido
  if (currentChunk.trim()) {
    console.log(`Creating final chunk ${chunkNumber}, size: ${currentChunk.length} characters`);
    chunks.push(currentChunk.trim());
  }
  
  console.log(`Total chunks created: ${chunks.length}`);
  chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1} size: ${chunk.length} characters`);
  });
  
  return chunks;
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
