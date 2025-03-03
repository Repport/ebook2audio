
import { useEffect } from 'react';
import { 
  saveConversionState, 
  loadConversionState, 
  clearConversionStorage,
  convertArrayBufferToBase64 
} from '@/services/storage/conversionStorageService';

export const useConversionStorage = (
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error',
  progress: number,
  audioData: ArrayBuffer | null,
  audioDuration: number,
  currentFileName: string | null,
  conversionId: string | null,
  conversionStartTime: number | undefined,
  elapsedTime: number,
  setConversionStatus: (status: 'idle' | 'converting' | 'completed' | 'error') => void,
  setProgress: (progress: number) => void,
  setAudioData: (data: ArrayBuffer | null) => void,
  setAudioDuration: (duration: number) => void,
  setCurrentFileName: (fileName: string | null) => void,
  setConversionId: (id: string | null) => void,
  setElapsedTime: (time: number) => void,
  setConversionStartTime: (time: number | undefined) => void
) => {
  // Load saved state on initialization
  useEffect(() => {
    const loadState = async () => {
      const savedState = await loadConversionState();
      if (savedState) {
        setConversionStatus(savedState.status);
        setProgress(savedState.progress);
        setCurrentFileName(savedState.fileName || null);
        setConversionId(savedState.conversionId || null);
        
        // Restore elapsed time if it exists
        if (savedState.elapsedTime) {
          setElapsedTime(savedState.elapsedTime);
        }
        
        // Restore start time if it exists
        if (savedState.conversionStartTime) {
          setConversionStartTime(savedState.conversionStartTime);
        }
        
        if (savedState.audioData) {
          try {
            const audioArrayBuffer = new TextEncoder().encode(savedState.audioData).buffer;
            setAudioData(audioArrayBuffer);
          } catch (error) {
            console.error('Error converting saved audio data:', error);
          }
        }
        setAudioDuration(savedState.audioDuration);
      }
    };

    loadState();
  }, []);

  // Save state when it changes
  useEffect(() => {
    const saveState = async () => {
      if (conversionStatus !== 'idle') {
        try {
          const currentTime = Date.now();
          const currentElapsedTime = Math.floor((currentTime - (conversionStartTime || currentTime)) / 1000);
          
          // Only update the elapsed time if it's greater than the current
          // or if we don't have a current time
          if (currentElapsedTime > elapsedTime || elapsedTime === 0) {
            setElapsedTime(currentElapsedTime);
          }
          
          const state = {
            status: conversionStatus,
            progress,
            audioData: audioData ? convertArrayBufferToBase64(audioData) : undefined,
            audioDuration,
            fileName: currentFileName || undefined,
            conversionId: conversionId || undefined,
            elapsedTime: currentElapsedTime,
            conversionStartTime
          };
          
          await saveConversionState(state);
        } catch (error) {
          console.error('Error saving conversion state:', error);
        }
      }
    };

    saveState();
  }, [conversionStatus, progress, audioData, audioDuration, currentFileName, conversionId, conversionStartTime, elapsedTime]);

  return { clearConversionStorage };
};
