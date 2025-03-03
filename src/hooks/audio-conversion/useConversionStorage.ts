
import { useEffect, useRef } from 'react';
import { 
  saveConversionState, 
  loadConversionState, 
  clearConversionStorage,
  convertArrayBufferToBase64 
} from '@/services/storage/conversionStorageService';
import { useConversionStore } from '@/store/conversionStore';

export const useConversionStorage = () => {
  // Use a ref to track if we're currently loading state to prevent save/load loops
  const isLoadingState = useRef(false);
  // Use a ref to track the last saved state hash to prevent unnecessary saves
  const lastSavedStateHash = useRef<string>('');
  // Use a debounce timer ref to prevent rapid successive saves
  const saveTimerRef = useRef<number | null>(null);

  // Load saved state on initialization only
  useEffect(() => {
    const loadState = async () => {
      try {
        // Set loading flag to prevent save triggering during load
        isLoadingState.current = true;

        const savedState = await loadConversionState();
        if (!savedState) {
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
              const audioArrayBuffer = new TextEncoder().encode(savedState.audioData).buffer;
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
        // Clear loading flag when done
        isLoadingState.current = false;
      }
    };

    loadState();
    // This effect runs only once on mount
  }, []);

  // Save store state when it changes, with debounce and loop prevention
  useEffect(() => {
    const handleStoreChange = (state: any) => {
      // Don't save if we're currently loading - prevents loops
      if (isLoadingState.current) {
        return;
      }
      
      // Only save if we're not in idle state
      if (state.status !== 'idle') {
        // Debounce the save operation to prevent rapid saves
        if (saveTimerRef.current !== null) {
          window.clearTimeout(saveTimerRef.current);
        }
        
        saveTimerRef.current = window.setTimeout(() => {
          saveState(state);
          saveTimerRef.current = null;
        }, 300); // 300ms debounce
      }
    };
    
    // Subscribe to store changes
    const unsubscribe = useConversionStore.subscribe(handleStoreChange);
    
    return () => {
      // Cleanup: cancel any pending saves and unsubscribe
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      unsubscribe();
    };
  }, []);
  
  // Function to save the state
  const saveState = async (state: any) => {
    try {
      // Create a simplified state object for storage
      const storageState = {
        status: state.status,
        progress: state.progress,
        audioData: state.audioData ? convertArrayBufferToBase64(state.audioData) : undefined,
        audioDuration: state.audioDuration,
        fileName: state.fileName || undefined,
        conversionId: state.conversionId || undefined,
        elapsedTime: state.time.elapsed,
        conversionStartTime: state.time.startTime
      };
      
      // Create a simple hash of the state to compare with last saved state
      const stateHash = `${state.status}-${state.progress}-${state.conversionId || ''}-${state.time.elapsed}`;
      
      // Only save if state is different from last saved state
      if (stateHash !== lastSavedStateHash.current) {
        lastSavedStateHash.current = stateHash;
        await saveConversionState(storageState);
      }
    } catch (error) {
      console.error('Error saving conversion state:', error);
    }
  };

  return { clearConversionStorage };
};
