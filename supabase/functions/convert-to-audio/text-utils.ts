
export function normalizeText(text: string): string {
  return text
    .normalize('NFKD') // Normalizar caracteres descompuestos
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
    .replace(/[\u2018\u2019]/g, "'") // Normalizar comillas simples
    .replace(/[\u201C\u201D]/g, '"') // Normalizar comillas dobles
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remover caracteres de control
    .trim();
}

export function splitTextIntoChunks(text: string, maxChunkSize: number = 4800): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Dividir por oraciones para mantener coherencia
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxChunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

export function deobfuscateData(data: string): string {
  const key = 'epub2audio';
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

export function cleanText(text: string): string {
  return text
    .replace(/\n+/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/\[pdf\]/gi, '')
    .replace(/\[page\s*\d*\]/gi, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/([.!?])\s*(\w)/g, '$1 $2')
    .trim();
}
