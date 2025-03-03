
import { useCallback } from 'react';
import { Chapter } from '@/utils/textExtraction';
import { TextChunkCallback } from '@/services/conversion/types/chunks';
import { useAudioState } from './audio-conversion/useAudioState';
import { useConversionStorage } from './audio-conversion/useConversionStorage';
import { useConversionActions } from './audio-conversion/useConversionActions';

export const useAudioConversion = () => {
  // Use our specialized hooks
  const audioState = useAudioState();
  
  const { clearConversionStorage } = useConversionStorage(
    audioState.conversionStatus,
    audioState.progress,
    audioState.audioData,
    audioState.audioDuration,
    audioState.currentFileName,
    audioState.conversionId,
    audioState.conversionStartTime,
    audioState.elapsedTime,
    audioState.setConversionStatus,
    audioState.setProgress,
    audioState.setAudioData,
    audioState.setAudioDuration,
    audioState.setCurrentFileName,
    audioState.setConversionId,
    audioState.setElapsedTime,
    audioState.setConversionStartTime
  );
  
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
    handleDownload(fileName, audioState.audioData);
  }, [handleDownload, audioState.audioData]);

  return {
    conversionStatus: audioState.conversionStatus,
    progress: audioState.progress,
    audioData: audioState.audioData,
    audioDuration: audioState.audioDuration,
    handleConversion,
    handleDownload: handleDownloadWithAudioData,
    resetConversion,
    conversionId: audioState.conversionId,
    elapsedTime: audioState.elapsedTime,
    setProgress: audioState.setProgress,
    setConversionStatus: audioState.setConversionStatus
  };
};
