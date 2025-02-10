
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { convertToAudio } from '@/services/conversion';
import { Chapter } from '@/utils/textExtraction';
import { useAuth } from '@/hooks/useAuth';
import { saveConversionState, loadConversionState, convertArrayBufferToBase64, convertBase64ToArrayBuffer, clearConversionStorage } from '@/services/storage/conversionStorageService';
import { calculateAudioDuration } from '@/services/audio/audioUtils';
import { saveToSupabase } from '@/services/storage/supabaseStorageService';
import { useConversionState } from './useConversionState';
import { useConversionActions } from './useConversionActions';

export const useAudioConversion = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
    setConversionId
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
        clearConversionStorage();
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
    setConversionStatus
  };
};
