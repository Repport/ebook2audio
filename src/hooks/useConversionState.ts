
import { useState, useEffect } from 'react';
import { loadConversionState, saveConversionState, convertArrayBufferToBase64, convertBase64ToArrayBuffer, clearConversionStorage } from '@/services/storage/conversionStorageService';

export const useConversionState = () => {
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [conversionId, setConversionId] = useState<string | null>(null);

  // Load stored state on mount
  useEffect(() => {
    const storedState = loadConversionState();
    if (storedState) {
      console.log('Loaded stored conversion state:', storedState);
      setConversionStatus(storedState.status);
      setProgress(Math.min(storedState.progress, 100));
      setCurrentFileName(storedState.fileName || null);
      if (storedState.audioData) {
        try {
          const audio = convertBase64ToArrayBuffer(storedState.audioData);
          setAudioData(audio);
          setAudioDuration(storedState.audioDuration || 0);
        } catch (error) {
          console.error('Error loading stored audio data:', error);
          clearConversionStorage();
        }
      }
    }
  }, []);

  // Save state changes to storage
  useEffect(() => {
    if (conversionStatus === 'idle') {
      clearConversionStorage();
      return;
    }
    
    try {
      console.log('Saving conversion state:', {
        status: conversionStatus,
        progress: Math.min(progress, 100),
        fileName: currentFileName,
        hasAudioData: !!audioData
      });

      saveConversionState({
        status: conversionStatus,
        progress: Math.min(progress, 100),
        audioDuration,
        fileName: currentFileName || undefined,
        audioData: audioData ? convertArrayBufferToBase64(audioData) : undefined
      });
    } catch (error) {
      console.error('Error saving conversion state:', error);
    }
  }, [conversionStatus, progress, audioData, audioDuration, currentFileName]);

  return {
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    currentFileName,
    conversionId,
    setConversionStatus,
    setProgress,
    setAudioData,
    setAudioDuration,
    setCurrentFileName,
    setConversionId
  };
};
