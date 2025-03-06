
import { useCallback, useEffect, useState, useRef } from 'react';
import { useSessionState } from './session-storage/useSessionState';
import { useSessionLoad } from './session-storage/useSessionLoad';
import { saveToSessionStorage, clearSessionStorageData as clearStorageData } from './session-storage/useSessionSave';
import { useToast } from './use-toast';

export const useSessionStorage = () => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const hasLoadedRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const { toast } = useToast();

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
    setConversionInProgress,
    isInitialized,
    setIsInitialized
  } = useSessionState();
  
  // Load from session storage - provides refs to track loading state
  const { isLoadingFromStorage, isInitialLoad, lastSavedState } = useSessionLoad(
    setCurrentStep,
    setExtractedText,
    setChapters,
    setDetectedLanguage,
    setSelectedFile,
    setConversionInProgress,
    setIsInitialized
  );

  // Save to session storage with debounce
  const saveSessionState = useCallback(() => {
    // Skip if initial load or loading from storage is in progress
    if (isLoadingFromStorage.current || !isInitialized || !hasLoadedRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    // Skip if no file is selected or we're on step 1
    if (currentStep <= 1 || !selectedFile) {
      if (currentStep <= 1) {
        console.log('Clearing session storage as we are on step 1');
        clearStorageData();
      }
      return;
    }

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save operations
    saveTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;

      try {
        console.log('Saving state to sessionStorage...');
        
        saveToSessionStorage({
          currentStep,
          extractedText,
          chapters,
          detectedLanguage,
          selectedFile,
          conversionInProgress,
          lastSavedState
        });
        
        console.log('State saved to sessionStorage successfully');
        pendingSaveRef.current = false;
      } catch (err) {
        console.error('Error saving to sessionStorage:', err);
        
        toast({
          title: "Save Error",
          description: "Failed to save your progress. Please try again.",
          variant: "destructive",
        });
      } finally {
        saveTimeoutRef.current = null;
      }
    }, 1000); // 1000ms debounce
  }, [
    currentStep,
    selectedFile,
    extractedText,
    chapters,
    detectedLanguage,
    conversionInProgress,
    isLoadingFromStorage,
    lastSavedState,
    isInitialized,
    toast
  ]);

  // Set loaded flag after component is mounted and initialized
  useEffect(() => {
    if (isInitialized && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      // If there was a pending save, do it now
      if (pendingSaveRef.current) {
        saveSessionState();
      }
    }
  }, [isInitialized, saveSessionState]);

  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Save state when any relevant state changes
  useEffect(() => {
    if (isInitialized && hasLoadedRef.current) {
      saveSessionState();
    }
  }, [
    isInitialized,
    currentStep,
    selectedFile,
    extractedText,
    chapters,
    detectedLanguage,
    conversionInProgress,
    saveSessionState
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
