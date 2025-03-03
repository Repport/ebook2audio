
import { useEffect } from 'react';
import { 
  saveConversionState, 
  loadConversionState, 
  clearConversionStorage,
  convertArrayBufferToBase64 
} from '@/services/storage/conversionStorageService';
import { useConversionStore } from '@/store/conversionStore';

// This hook now only syncs the store with storage, not with component state
export const useConversionStorage = () => {
  // Load saved state on initialization and sync with the store
  useEffect(() => {
    const loadState = async () => {
      const savedState = await loadConversionState();
      if (savedState) {
        // Get the current store state
        const store = useConversionStore.getState();
        
        // Restore the state to the store
        if (savedState.status !== 'idle') {
          // Only restore non-idle states
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
            
            // If we have more detailed state, restore it
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
              // This will trigger the time update in the store
              store.time = {
                elapsed: savedState.elapsedTime,
                remaining: null,
                startTime: newStartTime
              };
            }
          } else if (savedState.status === 'error') {
            // Restore error state
            store.setError('Error recuperado del almacenamiento');
          }
        }
      }
    };

    loadState();
  }, []);

  // Save store state when it changes
  useEffect(() => {
    const unsubscribe = useConversionStore.subscribe(
      (state) => {
        // Only save if we're not in idle state
        if (state.status !== 'idle') {
          saveState(state);
        }
      }
    );
    
    return () => unsubscribe();
  }, []);
  
  // Function to save the state
  const saveState = async (state: any) => {
    try {
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
      
      await saveConversionState(storageState);
    } catch (error) {
      console.error('Error saving conversion state:', error);
    }
  };

  return { clearConversionStorage };
};
