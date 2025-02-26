
/**
 * Crea un buffer de audio de silencio para usar como placeholder
 */
export function createSilencePlaceholder(): ArrayBuffer {
  const silencePlaceholder = new Uint8Array([
    0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  return silencePlaceholder.buffer;
}

/**
 * Combina múltiples buffers de audio en uno solo
 */
export function combineAudioBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  // Calcular el tamaño total para el archivo final
  const totalLength = buffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
  console.log(`Creating final audio with total size: ${totalLength} bytes`);
  
  // Crear buffer final
  const finalAudioBuffer = new Uint8Array(totalLength);
  
  // Combinar todos los chunks en el buffer final
  let offset = 0;
  buffers.forEach((buffer, index) => {
    const chunkData = new Uint8Array(buffer);
    console.log(`Adding chunk ${index + 1} to final audio, size: ${chunkData.byteLength} bytes`);
    finalAudioBuffer.set(chunkData, offset);
    offset += chunkData.byteLength;
  });
  
  return finalAudioBuffer.buffer;
}

/**
 * Decodifica audio en formato base64 a un ArrayBuffer
 */
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
