
import { StoredConversionState } from './types';

const CHUNK_SIZE = 500000; // 500KB chunks

/**
 * Saves conversion state to session storage, handling large audio data by chunking
 */
export const saveToSessionStorage = (state: StoredConversionState): void => {
  try {
    // If there's audio data, store it in chunks
    if (state.audioData) {
      const chunks = Math.ceil(state.audioData.length / CHUNK_SIZE);
      sessionStorage.setItem('conversionState_chunks', chunks.toString());
      
      // Store each chunk separately
      for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = start + CHUNK_SIZE;
        const chunk = state.audioData.slice(start, end);
        sessionStorage.setItem(`conversionState_chunk_${i}`, chunk);
      }
      
      // Store the main state without audio data
      const stateWithoutAudio = { ...state, audioData: undefined };
      sessionStorage.setItem('conversionState', JSON.stringify(stateWithoutAudio));
    } else {
      // If no audio data, store the state normally
      sessionStorage.setItem('conversionState', JSON.stringify(state));
    }
  } catch (error) {
    console.error('❌ Error saving to session storage:', error);
    clearSessionStorage();
  }
};

/**
 * Loads conversion state from session storage, reconstructing chunked audio data
 */
export const loadFromSessionStorage = (): StoredConversionState | null => {
  try {
    const stored = sessionStorage.getItem('conversionState');
    if (!stored) {
      console.log('No state saved in sessionStorage');
      return null;
    }
    
    const state = JSON.parse(stored) as StoredConversionState;
    
    // Reconstruct audio data from chunks if they exist
    const chunks = parseInt(sessionStorage.getItem('conversionState_chunks') || '0');
    if (chunks > 0) {
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
    console.error('❌ Error loading from session storage:', error);
    return null;
  }
};

/**
 * Clears all conversion-related data from session storage
 */
export const clearSessionStorage = (): void => {
  console.log('🧹 Cleaning conversion state from sessionStorage');
  // Get all keys in sessionStorage
  const keys = Object.keys(sessionStorage);
  
  // Remove all conversion-related items
  keys.forEach(key => {
    if (key.startsWith('conversionState')) {
      sessionStorage.removeItem(key);
    }
  });
};
