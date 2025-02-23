
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelay: number,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`${operationName}: Attempt ${attempt}/${maxRetries}`);
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`⚠️ Attempt ${attempt}/${maxRetries} failed: ${error.message}\n`);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
}

export function validateChunk(text: string): boolean {
  if (!text || text.trim().length === 0) {
    throw new Error('Text chunk cannot be empty');
  }

  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  const maxBytes = 4800;
  
  if (bytes.length > maxBytes) {
    console.error(`Text length: ${text.length}, Bytes: ${bytes.length}`);
    throw new Error(`Text chunk exceeds maximum length of ${maxBytes} bytes (current: ${bytes.length} bytes)`);
  }

  return true;
}

export function splitTextIntoChunks(text: string, maxSize: number = 4800): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  const words = text.split(/\s+/);

  for (const word of words) {
    const testChunk = currentChunk + (currentChunk ? ' ' : '') + word;
    const encoder = new TextEncoder();
    const testBytes = encoder.encode(testChunk);

    if (testBytes.length > maxSize && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = word;
    } else {
      currentChunk = testChunk;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
