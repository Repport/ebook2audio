
import { useCallback } from 'react';
import { Chapter } from '@/utils/textExtraction';
import { TextChunkCallback } from '@/services/conversion/types/chunks';
import { useAudioState } from './audio-conversion/useAudioState';
import { useConversionStorage } from './audio-conversion/useConversionStorage';
import { useConversionActions } from './audio-conversion/useConversionActions';

export const useAudioConversion = () => {
  // Use our specialized hooks
  const audioState = useAudioState();
  
  // No longer passing arguments to useConversionStorage
  const { clearConversionStorage } = useConversionStorage();
  
  const { resetConversion, handleConversion, handleDownload } = useConversionActions(
    audioState.setConversionStatus,
    audioState.setProgress,
    audioState.setAudioData,
    audioState.setAudioDuration,
    audioState.setConversionId,
    audioState.setCurrentFileName,
    audioState.setElapsedTime,
    audioState.setConversionStartTime,
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

  return {
    // State
    conversionStatus: audioState.conversionStatus,
    progress: audioState.progress,
    audioData: audioState.audioData,
    audioDuration: audioState.audioDuration,
    elapsedTime: audioState.elapsedTime,
    conversionId: audioState.conversionId,
    
    // Methods
    handleConversion,
    handleDownload: handleDownloadWithAudioData,
    resetConversion,
    
    // State setters
    setProgress: audioState.setProgress,
    setConversionStatus: audioState.setConversionStatus
  };
};
