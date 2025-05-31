
import { useEffect, useRef, useState, useCallback } from 'react'; // Added useState, useCallback
import { useToast } from '../use-toast';
import {
  LoadedSessionState,
  UseSessionLoadReturn
} from '../../types/hooks/session';
import { Chapter } from '../../types/hooks/conversion'; // Assuming Chapter is here
import { createStateSnapshot } from './sessionStorageUtils'; // Import the moved function

/**
 * Hook for loading data from session storage
 */
export const useSessionLoad = (
  setCurrentStep: (step: number) => void,
  setExtractedText: (text: string) => void,
  setChapters: (chapters: any[]) => void,
  setDetectedLanguage: (language: string) => void,
  setSelectedFile: (file: File | null) => void,
  setConversionInProgress: (inProgress: boolean) => void,
  setIsInitialized: (isInitialized: boolean) => void
): UseSessionLoadReturn => {
  // State for the new return type
  const [loadedSession, setLoadedSession] = useState<LoadedSessionState | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(false);
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);

  // Original refs - may or may not be used by the placeholder logic
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

        let updatedState = false;
        
        // Handle the case when there's no saved state
        if (!savedStep && !savedText && !savedFileName) {
          console.log('No valid saved state found in sessionStorage');
          // Still mark as initialized even if no state was loaded
          setIsInitialized(true);
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
        const parsedStep = parseInt(savedStep || '1');
        
        if (!isNaN(parsedStep) && parsedStep > 0) {
          console.log(`Setting current step to ${parsedStep}`);
          setCurrentStep(parsedStep);
          updatedState = true;
        }
        
        if (savedText) {
          console.log(`Setting extracted text (length: ${savedText.length})`);
          setExtractedText(savedText);
          updatedState = true;
        } else {
          setExtractedText('');
        }
        
        if (savedChapters) {
          try {
            const parsedChapters = JSON.parse(savedChapters);
            if (Array.isArray(parsedChapters)) {
              console.log(`Setting chapters (count: ${parsedChapters.length})`);
              setChapters(parsedChapters);
              updatedState = true;
            } else {
              setChapters([]);
            }
          } catch (err) {
            console.error('Error parsing saved chapters:', err);
            setChapters([]);
          }
        } else {
          setChapters([]);
        }
        
        if (savedLanguage) {
          console.log(`Setting detected language to ${savedLanguage}`);
          setDetectedLanguage(savedLanguage);
          updatedState = true;
        } else {
          setDetectedLanguage('english');
        }

        if (savedFileType && savedFileLastModified && savedFileSize && savedFileName) {
          try {
            const file = new File(
              [new Blob([])],
              savedFileName,
              {
                type: savedFileType,
                lastModified: parseInt(savedFileLastModified || '0'),
              }
            );
            console.log(`Setting selected file: ${savedFileName}`);
            setSelectedFile(file);
            updatedState = true;
          } catch (err) {
            console.error('Error creating file from saved data:', err);
            setSelectedFile(null);
          }
        } else {
          setSelectedFile(null);
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
        
        // Mark as initialized regardless of success or failure
        setIsInitialized(true);
        
        // Reset loading flags immediately - removing the setTimeout
        isLoadingFromStorage.current = false;
        isInitialLoad.current = false;
        hasLoadedInitialState.current = true;
        console.log('Load flags reset immediately');
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
    setIsInitialized, 
    toast
  ]);

  // Placeholder implementations for UseSessionLoadReturn
  const loadSession = useCallback(async (sessionId: string): Promise<LoadedSessionState | null> => {
    console.log(`loadSession called with sessionId: ${sessionId} - Not implemented`);
    setIsSessionLoading(true);
    setSessionLoadError(null);
    // Simulate API call or complex loading logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    // This should ideally interact with sessionStorage or a backend if sessionId is used.
    // For now, returns a mock.
    const mockSession: LoadedSessionState = {
      chapters: [{id: '1', title: 'Mock Chapter', startTime: 0, endTime: 60}],
      lastModified: Date.now()
    };
    setLoadedSession(mockSession);
    setIsSessionLoading(false);
    return mockSession;
  }, []);

  const clearLoadedSession = useCallback(() => {
    console.log('clearLoadedSession called - Not fully implemented');
    setLoadedSession(null);
    // This should also clear relevant items from sessionStorage if applicable
  }, []);

  // TODO: The original hook's return (refs) is incompatible with UseSessionLoadReturn.
  // The original useEffect still runs and calls prop setters.
  // This placeholder return satisfies the type but doesn't integrate the original logic.
  return {
    loadedSession,
    isSessionLoading,
    sessionLoadError,
    loadSession,
    clearLoadedSession,
  };
};
