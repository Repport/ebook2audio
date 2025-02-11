
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversionState } from './useConversionState';
import { useConversionActions } from './useConversionActions';

export const useAudioConversion = () => {
  const { user } = useAuth();
  const {
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    currentFileName,
    conversionId,
    setProgress,
    setConversionStatus,
    setAudioData,
    setAudioDuration,
    setCurrentFileName,
    setConversionId,
    toast
  } = useConversionState();

  const {
    handleConversion,
    handleDownload,
    resetConversion
  } = useConversionActions({
    user,
    toast,
    conversionStatus,
    audioData,
    currentFileName,
    setConversionStatus,
    setProgress,
    setAudioData,
    setAudioDuration,
    setCurrentFileName,
    setConversionId
  });

  // Add timeout for stuck conversions
  useEffect(() => {
    let timeoutId: number;
    
    if (conversionStatus === 'converting' && progress === 100) {
      timeoutId = window.setTimeout(() => {
        resetConversion();
        toast({
          title: "Conversion timed out",
          description: "Please try again",
          variant: "destructive",
        });
      }, 60000); // Reset after 1 minute of being stuck
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [conversionStatus, progress, resetConversion, toast]);

  return {
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    currentFileName,
    conversionId,
    handleConversion,
    handleDownload,
    resetConversion,
    setProgress,
    setConversionStatus,
    setAudioData,
    setAudioDuration,
    setCurrentFileName
  };
};
