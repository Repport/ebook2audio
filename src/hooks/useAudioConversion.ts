import { useCallback, useRef } from 'react';
import { Chapter } from '@/utils/textExtraction';
import { TextChunkCallback } from '@/services/conversion/types/chunks';
import { useAudioState } from './audio-conversion/useAudioState';
import { useConversionStorage } from './audio-conversion/useConversionStorage';
import { useConversionActions } from './audio-conversion/useConversionActions';

export const useAudioConversion = () => {
  // Use a ref to track if the component is mounted
  const mountedRef = useRef(true);
  
  // Use our specialized hooks
  const audioState = useAudioState();
  
  // No longer passing arguments to useConversionStorage
  const { clearConversionStorage } = useConversionStorage();
  
  // Create safe state updater functions
  const safeSetConversionStatus = useCallback((status) => {
    if (mountedRef.current) {
      audioState.setConversionStatus(status);
    }
  }, [audioState]);
  
  const safeSetProgress = useCallback((progress) => {
    if (mountedRef.current) {
      audioState.setProgress(progress);
    }
  }, [audioState]);
  
  const safeSetAudioData = useCallback((data) => {
    if (mountedRef.current) {
      audioState.setAudioData(data);
    }
  }, [audioState]);
  
  const safeSetAudioDuration = useCallback((duration) => {
    if (mountedRef.current) {
      audioState.setAudioDuration(duration);
    }
  }, [audioState]);
  
  const safeSetConversionId = useCallback((id) => {
    if (mountedRef.current) {
      audioState.setConversionId(id);
    }
  }, [audioState]);
  
  const safeSetCurrentFileName = useCallback((fileName) => {
    if (mountedRef.current) {
      audioState.setCurrentFileName(fileName);
    }
  }, [audioState]);
  
  const safeSetElapsedTime = useCallback((time) => {
    if (mountedRef.current) {
      audioState.setElapsedTime(time);
    }
  }, [audioState]);
  
  const safeSetConversionStartTime = useCallback((time) => {
    if (mountedRef.current) {
      audioState.setConversionStartTime(time);
    }
  }, [audioState]);
  
  const { resetConversion, handleConversion, handleDownload } = useConversionActions(
    safeSetConversionStatus,
    safeSetProgress,
    safeSetAudioData,
    safeSetAudioDuration,
    safeSetConversionId,
    safeSetCurrentFileName,
    safeSetElapsedTime,
    safeSetConversionStartTime,
    clearConversionStorage
  );

  // Wrap handleDownload to include audioData from state
  const handleDownloadWithAudioData = useCallback((fileName: string) => {
    if (!audioState.audioData) {
      console.error('Error: No audio data available for download');
      return;
    }
    handleDownload(fileName, audioState.audioData);
  }, [handleDownload, audioState.audioData]);
  
  // Add cleanup function to handle component unmounting
  const cleanup = useCallback(() => {
    mountedRef.current = false;
  }, []);

  return {
    // State
    conversionStatus: audioState.conversionStatus,
    progress: audioState.progress,
    audioData: audioState.audioData,
    audioDuration: audioState.audioDuration,
    elapsedTime: audioState.elapsedTime,
    conversionId: audioState.conversionId,
    
    // Methods
    handleConversion: (text, voice) => handleConversion(text, voice),
    handleDownload: handleDownloadWithAudioData,
    resetConversion,
    cleanup,
    
    // State setters
    setProgress: safeSetProgress,
    setConversionStatus: safeSetConversionStatus
  };
};
