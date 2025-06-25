
// Utilidades para testing
export const createMockFile = (name: string, content: string, type: string = 'text/plain'): File => {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};

export const createMockArrayBuffer = (size: number): ArrayBuffer => {
  return new ArrayBuffer(size);
};

export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const createMockConversionResult = (id: string, audioSize: number = 1024) => ({
  id,
  audio: createMockArrayBuffer(audioSize),
  duration: 60,
  metadata: {
    totalChunks: 5,
    processedChunks: 5,
    processingTime: 5000,
    audioSize
  }
});
