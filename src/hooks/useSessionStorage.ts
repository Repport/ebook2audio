
import { useState, useEffect, useCallback, useRef } from 'react';
import { Chapter } from '@/utils/textExtraction';
import { useToast } from './use-toast';

export const useSessionStorage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('english');
  const [conversionInProgress, setConversionInProgress] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Ref to prevent initial load from triggering save effect
  const isInitialLoad = useRef(true);
  // Ref to track the last saved state to prevent redundant saves
  const lastSavedState = useRef<string>('');
  // Ref to track if we're currently loading from storage
  const isLoadingFromStorage = useRef(false);

  // Load saved state from sessionStorage - only once
  useEffect(() => {
    const loadFromStorage = () => {
      // Set loading flag to prevent save during load
      isLoadingFromStorage.current = true;
      
      try {
        console.log('Loading state from sessionStorage...');
        const savedStep = sessionStorage.getItem('currentStep');
        const savedText = sessionStorage.getItem('extractedText');
        const savedChapters = sessionStorage.getItem('chapters');
        const savedLanguage = sessionStorage.getItem('detectedLanguage');
        const savedFileName = sessionStorage.getItem('fileName');
        const savedFileType = sessionStorage.getItem('fileType');
        const savedFileLastModified = sessionStorage.getItem('fileLastModified');
        const savedFileSize = sessionStorage.getItem('fileSize');
        const savedConversionInProgress = sessionStorage.getItem('conversionInProgress');

        // First check if we had a conversion in progress
        if (savedConversionInProgress === 'true') {
          setConversionInProgress(true);
          
          // Show recovery toast
          toast({
            title: "Conversion Recovery",
            description: "Recovering from previous conversion state",
            variant: "default",
            duration: 5000,
          });
        }

        let hasUpdates = false;
        
        if (savedStep && savedText && savedFileName) {
          const parsedStep = parseInt(savedStep);
          if (!isNaN(parsedStep) && parsedStep > 0) {
            setCurrentStep(parsedStep);
            hasUpdates = true;
          }
          
          setExtractedText(savedText);
          
          if (savedChapters) {
            try {
              const parsedChapters = JSON.parse(savedChapters);
              if (Array.isArray(parsedChapters)) {
                setChapters(parsedChapters);
              }
            } catch (err) {
              console.error('Error parsing saved chapters:', err);
            }
          }
          
          if (savedLanguage) {
            setDetectedLanguage(savedLanguage);
          }

          if (savedFileType && savedFileLastModified && savedFileSize) {
            try {
              const file = new File(
                [new Blob([])],
                savedFileName,
                {
                  type: savedFileType,
                  lastModified: parseInt(savedFileLastModified),
                }
              );
              setSelectedFile(file);
            } catch (err) {
              console.error('Error creating file from saved data:', err);
            }
          }
        }
        
        // Create a snapshot of the loaded state to compare later
        if (hasUpdates) {
          lastSavedState.current = createStateSnapshot(
            savedStep || '1',
            savedText || '',
            savedChapters || '[]',
            savedLanguage || 'english',
            savedConversionInProgress || 'false'
          );
        }
      } catch (err) {
        console.error('Error loading from sessionStorage:', err);
      } finally {
        // Reset loading flag
        isLoadingFromStorage.current = false;
        // Mark initial load as complete
        isInitialLoad.current = false;
      }
    };
    
    // Only load state once during component mount
    if (isInitialLoad.current) {
      loadFromStorage();
    }
    
    // No dependencies to prevent re-running
  }, []);

  // Helper function to create a string representation of the current state
  const createStateSnapshot = (
    step: string, 
    text: string, 
    chaptersJson: string, 
    language: string,
    inProgress: string
  ): string => {
    // Create a simple hash of the combined state
    return `${step}-${text.length}-${chaptersJson.length}-${language}-${inProgress}`;
  };

  // Save state to sessionStorage when it changes, with debounce
  useEffect(() => {
    // Skip during initial load or when we're loading from storage
    if (isInitialLoad.current || isLoadingFromStorage.current) {
      return;
    }
    
    // Debounce save operations
    const saveTimeout = setTimeout(() => {
      if (currentStep > 1 && selectedFile) {
        try {
          console.log('Saving state to sessionStorage...');
          
          // Create current state snapshot
          const currentSnapshot = createStateSnapshot(
            currentStep.toString(),
            extractedText,
            JSON.stringify(chapters),
            detectedLanguage,
            conversionInProgress.toString()
          );
          
          // Only save if state has actually changed
          if (currentSnapshot !== lastSavedState.current) {
            sessionStorage.setItem('currentStep', currentStep.toString());
            sessionStorage.setItem('extractedText', extractedText);
            sessionStorage.setItem('chapters', JSON.stringify(chapters));
            sessionStorage.setItem('detectedLanguage', detectedLanguage);
            sessionStorage.setItem('fileName', selectedFile.name);
            sessionStorage.setItem('fileType', selectedFile.type);
            sessionStorage.setItem('fileLastModified', selectedFile.lastModified.toString());
            sessionStorage.setItem('fileSize', selectedFile.size.toString());
            sessionStorage.setItem('conversionInProgress', conversionInProgress.toString());
            
            // Update last saved state
            lastSavedState.current = currentSnapshot;
            console.log('State saved to sessionStorage');
          } else {
            console.log('State unchanged, skipping save');
          }
        } catch (err) {
          console.error('Error saving to sessionStorage:', err);
        }
      } else {
        clearSessionStorageData();
      }
    }, 300); // 300ms debounce
    
    // Cleanup timeout
    return () => clearTimeout(saveTimeout);
  }, [currentStep, selectedFile, extractedText, chapters, detectedLanguage, conversionInProgress]);

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
  }, []);

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
