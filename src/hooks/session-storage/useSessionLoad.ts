
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
      console.log('Initial state already loaded, skipping');
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

        // Only proceed if we have valid saved state
        if (!savedStep || !savedText || !savedFileName) {
          console.log('No valid saved state found in sessionStorage');
          isLoadingFromStorage.current = false;
          hasLoadedInitialState.current = true;
          isInitialLoad.current = false;
          return;
        }

        console.log('Found valid saved state, proceeding with restore');

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

        // Batch state updates to minimize renders
        const parsedStep = parseInt(savedStep);
        let updatedState = false;
        
        if (!isNaN(parsedStep) && parsedStep > 0) {
          console.log(`Setting current step to ${parsedStep}`);
          setCurrentStep(parsedStep);
          updatedState = true;
        }
        
        if (savedText) {
          console.log(`Setting extracted text (length: ${savedText.length})`);
          setExtractedText(savedText);
          updatedState = true;
        }
        
        if (savedChapters) {
          try {
            const parsedChapters = JSON.parse(savedChapters);
            if (Array.isArray(parsedChapters)) {
              console.log(`Setting chapters (count: ${parsedChapters.length})`);
              setChapters(parsedChapters);
              updatedState = true;
            }
          } catch (err) {
            console.error('Error parsing saved chapters:', err);
          }
        }
        
        if (savedLanguage) {
          console.log(`Setting detected language to ${savedLanguage}`);
          setDetectedLanguage(savedLanguage);
          updatedState = true;
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
            console.log(`Setting selected file: ${savedFileName}`);
            setSelectedFile(file);
            updatedState = true;
          } catch (err) {
            console.error('Error creating file from saved data:', err);
          }
        }
        
        // Create a snapshot of the loaded state for comparison
        if (updatedState) {
          lastSavedState.current = createStateSnapshot(
            savedStep || '1',
            savedText || '',
            savedChapters || '[]',
            savedLanguage || 'english',
            savedConversionInProgress || 'false'
          );
          console.log('Created snapshot of loaded state for comparison');
        }
      } catch (err) {
        console.error('Error loading from sessionStorage:', err);
      } finally {
        console.log('Finished loading from sessionStorage');
        
        // Use setTimeout to ensure state updates have time to process
        // before we start saving again
        setTimeout(() => {
          // Reset loading flag
          isLoadingFromStorage.current = false;
          // Mark initial load as complete
          isInitialLoad.current = false;
          hasLoadedInitialState.current = true;
          console.log('Load flags reset after timeout');
        }, 100);
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
