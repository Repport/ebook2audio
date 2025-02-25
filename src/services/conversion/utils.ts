
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
 * Split text into smaller chunks while preserving sentence boundaries
 */
export function splitTextIntoChunks(text: string, maxSize: number = 4800): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  let currentSize = 0;
  
  // Dividir el texto en párrafos
  const paragraphs = text.split(/\n+/);
  
  for (const paragraph of paragraphs) {
    // Dividir párrafo en oraciones usando puntuación como delimitador
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
      const encoder = new TextEncoder();
      const sentenceBytes = encoder.encode(sentence + ' ').length;
      
      // Si la oración por sí sola excede el límite, dividirla por palabras
      if (sentenceBytes > maxSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
          currentSize = 0;
        }
        
        // Dividir la oración larga en palabras
        const words = sentence.split(/\s+/);
        let tempChunk = '';
        let tempSize = 0;
        
        for (const word of words) {
          const wordBytes = encoder.encode(word + ' ').length;
          
          if (tempSize + wordBytes > maxSize) {
            if (tempChunk) {
              chunks.push(tempChunk.trim());
              tempChunk = word + ' ';
              tempSize = wordBytes;
            } else {
              // Si una palabra es demasiado larga, dividirla en caracteres
              const chars = word.split('');
              let charChunk = '';
              let charSize = 0;
              
              for (const char of chars) {
                const charBytes = encoder.encode(char).length;
                if (charSize + charBytes > maxSize) {
                  chunks.push(charChunk);
                  charChunk = char;
                  charSize = charBytes;
                } else {
                  charChunk += char;
                  charSize += charBytes;
                }
              }
              
              if (charChunk) {
                chunks.push(charChunk);
              }
            }
          } else {
            tempChunk += word + ' ';
            tempSize += wordBytes;
          }
        }
        
        if (tempChunk) {
          chunks.push(tempChunk.trim());
        }
      }
      // Si la oración cabe en el chunk actual
      else if (currentSize + sentenceBytes <= maxSize) {
        currentChunk += sentence + ' ';
        currentSize += sentenceBytes;
      }
      // Si la oración no cabe, crear nuevo chunk
      else {
        chunks.push(currentChunk.trim());
        currentChunk = sentence + ' ';
        currentSize = sentenceBytes;
      }
    }
    
    // Añadir salto de párrafo si hay espacio
    if (currentSize + 2 <= maxSize) {
      currentChunk += '\n\n';
      currentSize += 2;
    }
  }
  
  // Añadir el último chunk si existe
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  // Validar y loguear todos los chunks
  console.log(`Dividiendo texto en ${chunks.length} chunks:`);
  chunks.forEach((chunk, index) => {
    const bytes = new TextEncoder().encode(chunk).length;
    console.log(`Chunk ${index + 1}: ${bytes} bytes, ${chunk.length} caracteres`);
    if (bytes > maxSize) {
      throw new Error(`Chunk ${index + 1} excede el límite de ${maxSize} bytes (${bytes} bytes)`);
    }
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
