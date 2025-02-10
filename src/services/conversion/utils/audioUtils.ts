
export function combineAudioChunks(audioChunks: ArrayBuffer[]): ArrayBuffer {
  const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
  const combinedBuffer = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of audioChunks) {
    combinedBuffer.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  return combinedBuffer.buffer;
}

export function decodeBase64Audio(base64Audio: string): ArrayBuffer {
  // Remove any whitespace and normalize the base64 string
  const cleanBase64 = base64Audio.replace(/[\n\r\s]/g, '');
  
  // Add padding if necessary
  const padding = cleanBase64.length % 4;
  const paddedBase64 = padding ? 
    cleanBase64.padEnd(cleanBase64.length + (4 - padding), '=') : 
    cleanBase64;

  // Validate base64 format
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(paddedBase64)) {
    throw new Error('Invalid base64 format');
  }

  const binaryString = atob(paddedBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

