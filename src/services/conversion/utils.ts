
// Simple XOR-based obfuscation
export function obfuscateData(data: string): string {
  const key = 'epub2audio';
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// Generate hash for text content using Web Crypto API
export async function generateHash(text: string, voiceId: string): Promise<string> {
  const data = `${text}-${voiceId}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Calculate optimal chunk size based on total text length
function calculateOptimalChunkSize(totalLength: number): number {
  // Google TTS has a 5000 byte limit
  const maxChunkSize = 5000;
  
  // For very small texts, use the entire text
  if (totalLength <= maxChunkSize) {
    return totalLength;
  }
  
  // For longer texts, use the max chunk size
  return maxChunkSize;
}

// Split text into smaller chunks with improved word boundary handling
export function splitTextIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  const optimalChunkSize = calculateOptimalChunkSize(text.length);
  const words = text.split(/\s+/);
  let currentChunk: string[] = [];
  let currentLength = 0;

  console.log(`Total text length: ${text.length}, Using chunk size: ${optimalChunkSize}`);

  for (let word of words) {
    const wordLength = word.length;
    const spaceLength = currentChunk.length > 0 ? 1 : 0;
    const potentialLength = currentLength + wordLength + spaceLength;

    if (potentialLength > optimalChunkSize && currentChunk.length > 0) {
      const chunk = currentChunk.join(" ").trim();
      if (chunk) {
        chunks.push(chunk);
        console.log(`Created chunk ${chunks.length}, size: ${chunk.length} characters`);
      }
      currentChunk = [word];
      currentLength = wordLength;
    } else {
      currentChunk.push(word);
      currentLength = potentialLength;
    }
  }

  // Add the final chunk if there's any remaining text
  if (currentChunk.length > 0) {
    const finalChunk = currentChunk.join(" ").trim();
    if (finalChunk) {
      chunks.push(finalChunk);
      console.log(`Created final chunk ${chunks.length}, size: ${finalChunk.length} characters`);
    }
  }

  // Log chunk information for debugging
  chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1}/${chunks.length}, size: ${chunk.length} characters`);
  });

  return chunks.filter(chunk => chunk.trim().length > 0);
}

// Error classification
function isTemporaryError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  const temporaryErrors = [
    'timeout',
    'network',
    'connection',
    'econnreset',
    'econnrefused',
    'too many requests',
    '429',
    '503',
    '504'
  ];

  return temporaryErrors.some(term => errorMessage.includes(term));
}

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  timeout?: number;
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelay = options.initialDelay ?? 1000;
  const timeout = options.timeout ?? 30000;
  let retryCount = 0;

  while (true) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => {
            controller.signal.addEventListener('abort', () => {
              reject(new Error(`Operation timed out after ${timeout}ms`));
            });
          }),
        ]);
        clearTimeout(timeoutId);
        return result;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      // If it's not a temporary error, fail fast
      if (!isTemporaryError(err) || retryCount >= maxRetries) {
        console.error(`Operation failed ${retryCount > 0 ? 'after ' + retryCount + ' retries' : 'immediately'}:`, err);
        throw err;
      }

      retryCount++;
      const delay = initialDelay * Math.pow(2, retryCount - 1) + Math.random() * 1000;
      console.log(`Temporary error detected, retry attempt ${retryCount} after ${delay}ms:`, err.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

