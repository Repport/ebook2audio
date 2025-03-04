
import { StoredConversionState } from './types';

/**
 * Saves conversion state to session storage (without audio data)
 */
export const saveStateToSession = (state: StoredConversionState): void => {
  try {
    // Store the state without audio data
    const stateWithoutAudio = { ...state, audioData: undefined };
    sessionStorage.setItem('conversionState', JSON.stringify(stateWithoutAudio));
  } catch (error) {
    console.error('❌ Error saving state to session storage:', error);
  }
};

/**
 * Loads conversion state from session storage (without audio data)
 */
export const loadStateFromSession = (): StoredConversionState | null => {
  try {
    const stored = sessionStorage.getItem('conversionState');
    if (!stored) {
      console.log('No state saved in sessionStorage');
      return null;
    }
    
    return JSON.parse(stored) as StoredConversionState;
  } catch (error) {
    console.error('❌ Error loading state from session storage:', error);
    return null;
  }
};

/**
 * Clears conversion state from session storage
 */
export const clearStateFromSession = (): void => {
  try {
    sessionStorage.removeItem('conversionState');
  } catch (error) {
    console.error('❌ Error clearing state from session storage:', error);
  }
};
