
import { useCallback, useEffect, useState } from 'react';
import { useSessionState } from './session-storage/useSessionState';
import { useSessionLoad } from './session-storage/useSessionLoad';
import { useSessionSave, clearSessionStorageData as clearStorageData } from './session-storage/useSessionSave';

export const useSessionStorage = () => {
  // Add a state to track initialization
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Trigger save only after initialization is complete
  useEffect(() => {
    if (!isInitialLoad.current && !isLoadingFromStorage.current) {
      setIsInitialized(true);
    }
  }, [isInitialLoad, isLoadingFromStorage]);

  // Only connect the save hook after initialization
  useEffect(() => {
    if (!isInitialized) {
      console.log('Skipping save hook connection until initialized');
      return;
    }

    console.log('Connecting session save hook');
    
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
  }, [
    isInitialized,
    isInitialLoad,
    isLoadingFromStorage,
    lastSavedState,
    currentStep,
    selectedFile, 
    extractedText,
    chapters,
    detectedLanguage,
    conversionInProgress
  ]);

  // Clear session storage data (using the imported function)
  const clearSessionStorageData = useCallback(() => {
    console.log('useSessionStorage: Clearing all session storage data');
    clearStorageData();
    
    // Reset the state
    setSelectedFile(null);
    setExtractedText('');
    setChapters([]);
    setCurrentStep(1);
    setDetectedLanguage('english');
    setConversionInProgress(false);
    
    // Reset the last saved state reference
    if (lastSavedState && typeof lastSavedState === 'object' && 'current' in lastSavedState) {
      (lastSavedState as { current: string }).current = '';
    }
  }, [
    setSelectedFile, 
    setExtractedText, 
    setChapters, 
    setCurrentStep, 
    setDetectedLanguage, 
    setConversionInProgress, 
    lastSavedState
  ]);

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
    clearSessionStorageData,
    isInitialized
  };
};
