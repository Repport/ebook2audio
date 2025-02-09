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
  // For very large texts (>100K chars), use larger chunks
  if (totalLength > 100000) return 10000;
  
  // For medium texts (20K-100K chars), use medium chunks
  if (totalLength > 20000) return 7500;
  
  // For smaller texts (5K-20K chars), use smaller chunks
  if (totalLength > 5000) return 5000;
  
  // For very small texts, use the entire text
  return totalLength;
}

// Split text into smaller chunks with improved handling and dynamic sizing
export function splitTextIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  const optimalChunkSize = calculateOptimalChunkSize(text.length);
  let currentChunk = '';
  
  // Split by sentences while preserving punctuation
  const sentences = text.split(/([.!?]+\s+)/);

  console.log(`Total text length: ${text.length}, Using chunk size: ${optimalChunkSize}`);

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const potentialChunk = currentChunk + sentence;

    // If adding the next sentence would exceed optimalChunkSize, save current chunk
    if (potentialChunk.length > optimalChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = potentialChunk;
    }
  }

  // Add the last chunk if there's any remaining text
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  // Log chunk information for debugging
  chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1}/${chunks.length}, size: ${chunk.length} characters`);
  });

  // Filter out empty chunks and ensure minimum content
  return chunks
    .filter(chunk => chunk.trim().length > 0)
    .map(chunk => chunk.trim());
}
