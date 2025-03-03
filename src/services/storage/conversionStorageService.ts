
import { supabase } from "@/integrations/supabase/client";
import { StoredConversionState } from './types';
import { saveToSessionStorage, loadFromSessionStorage, clearSessionStorage } from './sessionStorageService';
import { updateSupabaseConversion, fetchSupabaseConversion } from './supabaseStorageService';
import { convertArrayBufferToBase64, convertBase64ToArrayBuffer } from './encodingUtils';

/**
 * Saves the conversion state to both session storage and Supabase if applicable
 */
export const saveConversionState = async (state: StoredConversionState) => {
  try {
    // Update in Supabase if there's a conversion ID
    if (state.conversionId) {
      await updateSupabaseConversion(state);
    }

    // Save to session storage
    saveToSessionStorage(state);
  } catch (error) {
    console.error('❌ Error saving conversion state:', error);
    clearConversionStorage();
  }
};

/**
 * Loads conversion state from session storage and updates from Supabase if available
 */
export const loadConversionState = async (): Promise<StoredConversionState | null> => {
  try {
    // First try to load from session storage
    const state = loadFromSessionStorage();
    if (!state) {
      return null;
    }
    
    // If there's a conversion ID, get the latest state from Supabase
    if (state.conversionId) {
      const updatedState = await fetchSupabaseConversion(state.conversionId, state);
      
      console.log('Final loaded state:', {
        status: updatedState.status,
        progress: updatedState.progress,
        hasAudio: !!updatedState.audioData,
        conversionId: updatedState.conversionId,
        elapsedTime: updatedState.elapsedTime
      });
      
      return updatedState;
    }
    
    return state;
  } catch (error) {
    console.error('❌ Error loading conversion state:', error);
    clearConversionStorage();
    return null;
  }
};

/**
 * Clears all conversion storage data
 */
export const clearConversionStorage = () => {
  clearSessionStorage();
};

// Export encoding utilities
export { convertArrayBufferToBase64, convertBase64ToArrayBuffer };
