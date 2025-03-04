
import { useEffect, useRef } from 'react';
import { useToast } from '../use-toast';

/**
 * Create a string representation of the current state
 */
export const createStateSnapshot = (
  step: string, 
  text: string, 
  chaptersJson: string, 
  language: string,
  inProgress: string
): string => {
  return `${step}-${text.length}-${chaptersJson.length}-${language}-${inProgress}`;
};

/**
 * Hook for loading data from session storage
 */
export const useSessionLoad = (
  setCurrentStep: (step: number) => void,
  setExtractedText: (text: string) => void,
  setChapters: (chapters: any[]) => void,
  setDetectedLanguage: (language: string) => void,
  setSelectedFile: (file: File | null) => void,
  setConversionInProgress: (inProgress: boolean) => void
) => {
  const isLoadingFromStorage = useRef(false);
  const isInitialLoad = useRef(true);
  const lastSavedState = useRef<string>('');
  const hasLoadedInitialState = useRef(false);
  const { toast } = useToast();

  // Load saved state from sessionStorage - only once
  useEffect(() => {
    // Skip if we've already loaded the initial state
    if (hasLoadedInitialState.current) {
      return;
    }

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

        // First check if we have valid saved state
        if (!savedStep || !savedText || !savedFileName) {
          console.log('No valid saved state found in sessionStorage');
          isLoadingFromStorage.current = false;
          hasLoadedInitialState.current = true;
          isInitialLoad.current = false;
          return;
        }

        // Check if we had a conversion in progress
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
        hasLoadedInitialState.current = true;
      }
    };
    
    // Load state if this is our first time
    loadFromStorage();
    
  }, [
    setCurrentStep, 
    setExtractedText, 
    setChapters, 
    setDetectedLanguage, 
    setSelectedFile, 
    setConversionInProgress, 
    toast
  ]);

  return {
    isLoadingFromStorage,
    isInitialLoad,
    lastSavedState
  };
};
