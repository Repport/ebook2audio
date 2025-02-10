
interface StoredConversionState {
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  audioData?: string; // base64
  audioDuration: number;
  fileName?: string;
}

const CHUNK_SIZE = 500000; // 500KB chunks

export const saveConversionState = (state: StoredConversionState) => {
  try {
    // If there's audio data, we need to chunk it
    if (state.audioData) {
      const chunks = Math.ceil(state.audioData.length / CHUNK_SIZE);
      
      // Store the number of chunks
      sessionStorage.setItem('conversionState_chunks', chunks.toString());
      
      // Store each chunk separately
      for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = start + CHUNK_SIZE;
        const chunk = state.audioData.slice(start, end);
        sessionStorage.setItem(`conversionState_chunk_${i}`, chunk);
      }
      
      // Store the main state without the audio data
      const stateWithoutAudio = { ...state, audioData: undefined };
      sessionStorage.setItem('conversionState', JSON.stringify(stateWithoutAudio));
    } else {
      // If no audio data, store state normally
      sessionStorage.setItem('conversionState', JSON.stringify(state));
    }
  } catch (error) {
    console.error('Error saving conversion state:', error);
    // Clear all related storage if we hit an error
    clearConversionStorage();
  }
};

export const loadConversionState = (): StoredConversionState | null => {
  try {
    const stored = sessionStorage.getItem('conversionState');
    if (!stored) return null;
    
    const state = JSON.parse(stored);
    const chunks = parseInt(sessionStorage.getItem('conversionState_chunks') || '0');
    
    if (chunks > 0) {
      // Reconstruct audio data from chunks
      let audioData = '';
      for (let i = 0; i < chunks; i++) {
        const chunk = sessionStorage.getItem(`conversionState_chunk_${i}`);
        if (chunk) {
          audioData += chunk;
        }
      }
      state.audioData = audioData;
    }
    
    return state;
  } catch (error) {
    console.error('Error loading conversion state:', error);
    clearConversionStorage();
    return null;
  }
};

export const clearConversionStorage = () => {
  // Get all keys in sessionStorage
  const keys = Object.keys(sessionStorage);
  
  // Remove all conversion-related items
  keys.forEach(key => {
    if (key.startsWith('conversionState')) {
      sessionStorage.removeItem(key);
    }
  });
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

