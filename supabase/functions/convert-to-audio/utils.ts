
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

export function validateText(text: string): boolean {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  
  if (bytes.length > 5000) {
    throw new Error(`Text exceeds maximum length of 5000 bytes (current: ${bytes.length} bytes)`);
  }

  return true;
}
