
import { useCallback } from 'react';
import { useSessionState } from './session-storage/useSessionState';
import { useSessionLoad } from './session-storage/useSessionLoad';
import { useSessionSave, clearSessionStorageData } from './session-storage/useSessionSave';

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

  // Clear session storage data
  const clearSessionStorageData = useCallback(() => {
    try {
      console.log('Clearing sessionStorage data');
      sessionStorage.removeItem('currentStep');
      sessionStorage.removeItem('extractedText');
      sessionStorage.removeItem('chapters');
      sessionStorage.removeItem('detectedLanguage');
      sessionStorage.removeItem('fileName');
      sessionStorage.removeItem('fileType');
      sessionStorage.removeItem('fileLastModified');
      sessionStorage.removeItem('fileSize');
      sessionStorage.removeItem('conversionInProgress');
      
      // Reset the last saved state
      lastSavedState.current = '';
    } catch (err) {
      console.error('Error clearing sessionStorage:', err);
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
