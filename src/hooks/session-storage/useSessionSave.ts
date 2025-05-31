
import { RefObject } from 'react';
import { Chapter } from '@/utils/textExtraction';
import { createStateSnapshot } from './sessionStorageUtils'; // Updated import path

interface SessionStorageData {
  currentStep: number;
  extractedText: string;
  chapters: Chapter[];
  detectedLanguage: string;
  selectedFile: File | null;
  conversionInProgress: boolean;
  lastSavedState: RefObject<string>;
}

/**
 * Function to save data to session storage
 */
export const saveToSessionStorage = ({
  currentStep,
  extractedText,
  chapters,
  detectedLanguage,
  selectedFile,
  conversionInProgress,
  lastSavedState
}: SessionStorageData) => {
  try {
    if (currentStep <= 0) {
      console.warn('Invalid currentStep value:', currentStep);
      return;
    }

    // Create a snapshot before trying to save
    const currentSnapshot = createStateSnapshot(
      currentStep.toString(),
      extractedText || '',
      JSON.stringify(chapters || []),
      detectedLanguage || 'english',
      (conversionInProgress || false).toString()
    );
    
    // Skip saving if the state hasn't changed
    if (currentSnapshot === lastSavedState?.current) {
      console.log('State unchanged, skipping save operation');
      return;
    }
    
    console.log('Saving state to sessionStorage...');
    
    // Save to sessionStorage
    sessionStorage.setItem('currentStep', currentStep.toString());
    sessionStorage.setItem('extractedText', extractedText || '');
    sessionStorage.setItem('chapters', JSON.stringify(chapters || []));
    sessionStorage.setItem('detectedLanguage', detectedLanguage || 'english');
    
    if (selectedFile) {
      sessionStorage.setItem('fileName', selectedFile.name);
      sessionStorage.setItem('fileType', selectedFile.type);
      sessionStorage.setItem('fileLastModified', selectedFile.lastModified.toString());
      sessionStorage.setItem('fileSize', selectedFile.size.toString());
    } else {
      // Clear file-related data if no file is selected
      sessionStorage.removeItem('fileName');
      sessionStorage.removeItem('fileType');
      sessionStorage.removeItem('fileLastModified');
      sessionStorage.removeItem('fileSize');
    }
    
    sessionStorage.setItem('conversionInProgress', (conversionInProgress || false).toString());
    
    // Update last saved state reference
    if (lastSavedState && typeof lastSavedState === 'object' && 'current' in lastSavedState) {
      (lastSavedState as { current: string }).current = currentSnapshot;
      console.log('Updated lastSavedState reference');
    } else {
      console.warn('lastSavedState ref is invalid:', lastSavedState);
    }
    
    console.log('State saved to sessionStorage successfully');
  } catch (err) {
    console.error('Error saving to sessionStorage:', err);
  }
};

/**
 * Utility to clear session storage data
 */
export const clearSessionStorageData = () => {
  try {
    console.log('Clearing sessionStorage data');
    
    const keys = [
      'currentStep',
      'extractedText',
      'chapters',
      'detectedLanguage',
      'fileName',
      'fileType',
      'fileLastModified',
      'fileSize',
      'conversionInProgress'
    ];
    
    // Remove each key
    keys.forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    console.log('SessionStorage data cleared successfully');
  } catch (err) {
    console.error('Error clearing sessionStorage:', err);
  }
};
