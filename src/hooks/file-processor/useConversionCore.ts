
import { useCallback, useState } from 'react';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import {
  Chapter,
  UseAudioConversionReturn,
  UseConversionCoreReturn,
  ConvertToAudioResult,
  TextChunkCallback
} from '../../types/hooks/conversion';

import { useChaptersDetection } from './useChaptersDetection';
import { useTermsAndNotifications } from './useTermsAndNotifications';
import { useConversionEstimation } from './useConversionEstimation';

export function useConversionCore(
  selectedFile: File | null,
  extractedText: string,
  initialChapters: Chapter[],
  onStepComplete?: () => void
): UseConversionCoreReturn {
  const { showTerms, setShowTerms } = useTermsAndNotifications();
  const { 
    detectChapters, 
    setDetectChapters, 
    detectingChapters, 
  } = useChaptersDetection();
  const { calculateEstimatedSeconds } = useConversionEstimation(extractedText);
  const audioConversion = useAudioConversion();

  // Mapping conversionStatus based on UseAudioConversionReturn
  let currentConversionStatus: 'idle' | 'converting' | 'completed' | 'error' = 'idle';
  if (audioConversion.isConverting) {
    currentConversionStatus = 'converting';
  } else if (audioConversion.error) {
    currentConversionStatus = 'error';
  } else if (audioConversion.conversionProgress === 100) {
    currentConversionStatus = 'completed';
  }

  const handleDownloadWrapper = (fileName: string) => {
    console.log("handleDownloadClick called for:", fileName);
    audioConversion.handleDownload(fileName);
  };

  return {
    audioConversion,
    startAudioConversionProcess: audioConversion.executeTTSConversion,
    showTerms,
    setShowTerms,
    detectChapters,
    setDetectChapters,
    detectingChapters: detectingChapters || false,
    resetConversion: audioConversion.cancelConversion,
    conversionStatus: currentConversionStatus,
    progress: audioConversion.conversionProgress,
    audioData: audioConversion.audioData,
    conversionId: audioConversion.conversionId,
    elapsedTime: audioConversion.elapsedTime,
    handleDownloadClick: handleDownloadWrapper,
    calculateEstimatedSeconds,
  };
}
