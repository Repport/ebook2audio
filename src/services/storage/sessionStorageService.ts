
import { StoredConversionState } from './types';
import { saveAudioChunks, loadAudioChunks, clearAudioChunks } from './sessionChunkStorage';
import { saveStateToSession, loadStateFromSession, clearStateFromSession } from './sessionStateStorage';

/**
 * Saves conversion state to session storage, handling large audio data by chunking
 */
export const saveToSessionStorage = (state: StoredConversionState): void => {
  try {
    // If there's audio data, store it in chunks
    if (state.audioData) {
      saveAudioChunks(state.audioData);
      // Store the main state without audio data
      saveStateToSession(state);
    } else {
      // If no audio data, store the state normally
      saveStateToSession(state);
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
    // Load the main state
    const state = loadStateFromSession();
    if (!state) {
      return null;
    }
    
    // Reconstruct audio data from chunks if they exist
    const audioData = loadAudioChunks();
    if (audioData) {
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
  // Clear audio chunks
  clearAudioChunks();
  // Clear main state
  clearStateFromSession();
  
  // Remove any other conversion-related items
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith('conversionState')) {
      sessionStorage.removeItem(key);
    }
  });
};
