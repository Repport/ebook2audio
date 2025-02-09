
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

// Split text into smaller chunks with improved handling
export function splitTextIntoChunks(text: string, maxChunkSize = 1000): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by sentences while preserving punctuation
  const sentences = text.split(/([.!?]+\s+)/);

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const potentialChunk = currentChunk + sentence;

    // If adding the next sentence would exceed maxChunkSize, save current chunk
    if (potentialChunk.length > maxChunkSize && currentChunk.length > 0) {
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

  // Filter out empty chunks and ensure minimum content
  return chunks
    .filter(chunk => chunk.trim().length > 0)
    .map(chunk => chunk.trim());
}
