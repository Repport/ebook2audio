
import { useEffect, useRef, useCallback } from 'react';
import { 
  saveConversionState, 
  loadConversionState, 
  clearConversionStorage 
} from '@/services/storage/conversionStorageService';
import { useConversionStore } from '@/store/conversionStore';

/**
 * Hook for managing conversion storage with mechanisms to prevent update loops
 */
export const useConversionStorage = () => {
  // Use a ref to track if we're currently loading state to prevent save/load loops
  const isLoadingState = useRef(false);
  // Use a ref to track the last saved state hash to prevent unnecessary saves
  const lastSavedStateHash = useRef<string>('');
  // Use a debounce timer ref to prevent rapid successive saves
  const saveTimerRef = useRef<number | null>(null);
  // Flag to track if the hook is mounted
  const isMounted = useRef(true);

  // Create a safe version of the store state
  const createStorageState = useCallback((state: any) => {
    return {
      status: state.status,
      progress: state.progress,
      audioData: state.audioData ? convertArrayBufferToBase64(state.audioData) : undefined,
      audioDuration: state.audioDuration,
      fileName: state.fileName || undefined,
      conversionId: state.conversionId || undefined,
      elapsedTime: state.time.elapsed,
      conversionStartTime: state.time.startTime
    };
  }, []);

  // Compare if the new state is different enough to warrant a save
  const isStateDifferent = useCallback((prevHash: string, state: any) => {
    const stateHash = `${state.status}-${state.progress}-${state.conversionId || ''}-${state.time.elapsed}`;
    return stateHash !== prevHash;
  }, []);

  // Function to save the state with debounce
  const saveStateWithDebounce = useCallback((state: any) => {
    // Skip saving if we're currently loading state
    if (isLoadingState.current || !isMounted.current) {
      return;
    }
    
    // Only save if we're not in idle state
    if (state.status !== 'idle') {
      // Cancel any pending save operations
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      
      // Use debounce to prevent too many saves
      saveTimerRef.current = window.setTimeout(async () => {
        try {
          // Prepare simplified state for storage
          const storageState = createStorageState(state);
          
          // Only save if state is meaningfully different
          if (isStateDifferent(lastSavedStateHash.current, state)) {
            lastSavedStateHash.current = `${state.status}-${state.progress}-${state.conversionId || ''}-${state.time.elapsed}`;
            await saveConversionState(storageState);
            console.log('Saved conversion state:', { status: state.status, progress: state.progress });
          }
        } catch (error) {
          console.error('Error saving state:', error);
        } finally {
          saveTimerRef.current = null;
        }
      }, 300); // 300ms debounce
    }
  }, [createStorageState, isStateDifferent]);

  // Load saved state on initialization only
  useEffect(() => {
    const loadState = async () => {
      try {
        // Set loading flag to prevent save triggering during load
        isLoadingState.current = true;

        const savedState = await loadConversionState();
        if (!savedState || !isMounted.current) {
          console.log('No saved conversion state found');
          isLoadingState.current = false;
          return;
        }

        // Get the current store state and actions
        const store = useConversionStore.getState();
        
        // Only restore non-idle states
        if (savedState.status !== 'idle') {
          console.log(`Restoring saved conversion state: ${savedState.status}`);
          
          if (savedState.status === 'completed' && savedState.audioData) {
            try {
              const audioArrayBuffer = convertBase64ToArrayBuffer(savedState.audioData);
              store.completeConversion(
                audioArrayBuffer,
                savedState.conversionId || null,
                savedState.audioDuration || 0
              );
            } catch (error) {
              console.error('Error converting saved audio data:', error);
            }
          } else if (savedState.status === 'converting') {
            // Restore conversion in progress
            store.startConversion(savedState.fileName || null);
            
            // If we have progress, update it
            if (savedState.progress) {
              store.updateProgress({
                progress: savedState.progress,
                processedChunks: 0,
                totalChunks: 0,
                processedCharacters: 0,
                totalCharacters: 0,
                currentChunk: ''
              });
            }
            
            // Restore elapsed time if it exists
            if (savedState.elapsedTime && savedState.conversionStartTime) {
              const elapsedTimeMs = savedState.elapsedTime * 1000;
              const newStartTime = Date.now() - elapsedTimeMs;
              // Use the proper action instead of direct property modification
              store.updateElapsedTime(savedState.elapsedTime, newStartTime);
            }
          } else if (savedState.status === 'error') {
            // Restore error state
            store.setError('Error recuperado del almacenamiento');
          }
        }
      } catch (error) {
        console.error('Error loading conversion state:', error);
      } finally {
        // Only clear loading flag if component is still mounted
        if (isMounted.current) {
          isLoadingState.current = false;
        }
      }
    };

    loadState();
    // This effect runs only once on mount
  }, []);

  // Listen for store changes to save state
  useEffect(() => {
    // Subscribe to store changes - use selector to avoid unnecessary renders
    const unsubscribe = useConversionStore.subscribe(
      (state) => [state.status, state.progress, state.audioData, state.conversionId, state.time.elapsed],
      (newValues) => {
        // Get the full state
        const state = useConversionStore.getState();
        // Don't save if we're loading state
        if (!isLoadingState.current) {
          saveStateWithDebounce(state);
        }
      }
    );
    
    return () => {
      // Set mounted flag to false
      isMounted.current = false;
      
      // Cleanup: cancel any pending saves and unsubscribe
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      unsubscribe();
    };
  }, [saveStateWithDebounce]);
  
  // Import utility functions from storage service
  const { convertArrayBufferToBase64, convertBase64ToArrayBuffer } = require('@/services/storage/encodingUtils');
  
  return { clearConversionStorage };
};
