
interface StoredConversionState {
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  audioData?: string; // base64
  audioDuration: number;
  fileName?: string;
}

export const saveConversionState = (state: StoredConversionState) => {
  sessionStorage.setItem('conversionState', JSON.stringify(state));
};

export const loadConversionState = (): StoredConversionState | null => {
  const stored = sessionStorage.getItem('conversionState');
  return stored ? JSON.parse(stored) : null;
};

export const convertArrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const convertBase64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

