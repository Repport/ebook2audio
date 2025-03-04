
import { useCallback } from 'react';
import { useSessionState } from './session-storage/useSessionState';
import { useSessionLoad } from './session-storage/useSessionLoad';
import { useSessionSave, clearSessionStorageData as clearStorageData } from './session-storage/useSessionSave';

export const useSessionStorage = () => {
  // Get state from useSessionState
  const {
    selectedFile,
    setSelectedFile,
    extractedText,
    setExtractedText,
    chapters,
    setChapters,
    currentStep,
    setCurrentStep,
    detectedLanguage,
    setDetectedLanguage,
    conversionInProgress,
    setConversionInProgress
  } = useSessionState();
  
  // Load from session storage
  const { isLoadingFromStorage, isInitialLoad, lastSavedState } = useSessionLoad(
    setCurrentStep,
    setExtractedText,
    setChapters,
    setDetectedLanguage,
    setSelectedFile,
    setConversionInProgress
  );

  // Save to session storage
  useSessionSave(
    isInitialLoad,
    isLoadingFromStorage,
    lastSavedState,
    currentStep,
    selectedFile,
    extractedText,
    chapters,
    detectedLanguage,
    conversionInProgress
  );

  // Clear session storage data (using the imported function)
  const clearSessionStorageData = useCallback(() => {
    clearStorageData();
    
    // Reset the last saved state
    if (lastSavedState && typeof lastSavedState === 'object' && 'current' in lastSavedState) {
      (lastSavedState as { current: string }).current = '';
    }
  }, [lastSavedState]);

  return {
    selectedFile,
    setSelectedFile,
    extractedText,
    setExtractedText,
    chapters,
    setChapters,
    currentStep,
    setCurrentStep,
    detectedLanguage,
    setDetectedLanguage,
    conversionInProgress,
    setConversionInProgress,
    clearSessionStorageData
  };
};
