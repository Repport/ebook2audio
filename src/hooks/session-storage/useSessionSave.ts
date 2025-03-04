
import { useEffect, RefObject } from 'react';
import { Chapter } from '@/utils/textExtraction';
import { createStateSnapshot } from './useSessionLoad';

/**
 * Hook for saving data to session storage
 */
export const useSessionSave = (
  isInitialLoadRef: RefObject<boolean>,
  isLoadingFromStorageRef: RefObject<boolean>,
  lastSavedStateRef: RefObject<string>,
  currentStep: number,
  selectedFile: File | null,
  extractedText: string,
  chapters: Chapter[],
  detectedLanguage: string,
  conversionInProgress: boolean
) => {
  // Save state to sessionStorage when it changes, with debounce
  useEffect(() => {
    // Skip during initial load or when we're loading from storage
    if (isInitialLoadRef.current || isLoadingFromStorageRef.current) {
      console.log('Skipping save because we are loading initial state');
      return;
    }

    // Skip if no file is selected or we're on step 1
    if (currentStep <= 1 || !selectedFile) {
      if (currentStep <= 1) {
        clearSessionStorageData();
      }
      return;
    }
    
    // Debounce save operations
    const saveTimeout = setTimeout(() => {
      try {
        console.log('Preparing to save state to sessionStorage...');
        
        // Create current state snapshot
        const currentSnapshot = createStateSnapshot(
          currentStep.toString(),
          extractedText,
          JSON.stringify(chapters),
          detectedLanguage,
          conversionInProgress.toString()
        );
        
        // Only save if state has actually changed
        if (currentSnapshot !== lastSavedStateRef.current) {
          console.log('State changed, saving to sessionStorage');
          
          sessionStorage.setItem('currentStep', currentStep.toString());
          sessionStorage.setItem('extractedText', extractedText);
          sessionStorage.setItem('chapters', JSON.stringify(chapters));
          sessionStorage.setItem('detectedLanguage', detectedLanguage);
          sessionStorage.setItem('fileName', selectedFile.name);
          sessionStorage.setItem('fileType', selectedFile.type);
          sessionStorage.setItem('fileLastModified', selectedFile.lastModified.toString());
          sessionStorage.setItem('fileSize', selectedFile.size.toString());
          sessionStorage.setItem('conversionInProgress', conversionInProgress.toString());
          
          // Update last saved state reference
          if (lastSavedStateRef && typeof lastSavedStateRef === 'object' && 'current' in lastSavedStateRef) {
            (lastSavedStateRef as { current: string }).current = currentSnapshot;
          }
          
          console.log('State saved to sessionStorage successfully');
        } else {
          console.log('State unchanged, skipping save');
        }
      } catch (err) {
        console.error('Error saving to sessionStorage:', err);
      }
    }, 500); // Increase debounce to 500ms
    
    // Cleanup timeout
    return () => clearTimeout(saveTimeout);
  }, [currentStep, selectedFile, extractedText, chapters, detectedLanguage, conversionInProgress]);
};

/**
 * Utility to clear session storage data
 */
export const clearSessionStorageData = () => {
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
  } catch (err) {
    console.error('Error clearing sessionStorage:', err);
  }
};
