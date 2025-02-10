
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
  // Google TTS tiene un límite de 5000 caracteres
  const maxChunkSize = 4800; // Dejamos un margen de seguridad
  
  // Para textos muy pequeños, usar el texto completo
  if (totalLength <= maxChunkSize) {
    return totalLength;
  }
  
  return maxChunkSize;
}

// Divide el texto en chunks más pequeños con mejor manejo de límites de palabras
export function splitTextIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  const optimalChunkSize = calculateOptimalChunkSize(text.length);
  const words = text.split(/\s+/);
  let currentChunk: string[] = [];
  let currentLength = 0;

  console.log(`Longitud total del texto: ${text.length}, Usando tamaño de chunk: ${optimalChunkSize}`);

  for (let word of words) {
    const wordLength = word.length;
    const spaceLength = currentChunk.length > 0 ? 1 : 0;
    const potentialLength = currentLength + wordLength + spaceLength;

    if (potentialLength > optimalChunkSize && currentChunk.length > 0) {
      const chunk = currentChunk.join(" ").trim();
      if (chunk) {
        chunks.push(chunk);
        console.log(`Creado chunk ${chunks.length}, tamaño: ${chunk.length} caracteres`);
      }
      currentChunk = [word];
      currentLength = wordLength;
    } else {
      currentChunk.push(word);
      currentLength = potentialLength;
    }
  }

  // Agregar el último chunk si queda texto
  if (currentChunk.length > 0) {
    const finalChunk = currentChunk.join(" ").trim();
    if (finalChunk) {
      chunks.push(finalChunk);
      console.log(`Creado chunk final ${chunks.length}, tamaño: ${finalChunk.length} caracteres`);
    }
  }

  // Registrar información de los chunks para debugging
  chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1}/${chunks.length}, tamaño: ${chunk.length} caracteres`);
  });

  return chunks.filter(chunk => chunk.trim().length > 0);
}

