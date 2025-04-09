
import { useCallback } from 'react';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { Chapter } from '@/utils/textExtraction';
import { useChaptersDetection } from './useChaptersDetection';
import { useTermsAndNotifications } from './useTermsAndNotifications';
import { useConversionEstimation } from './useConversionEstimation';
import { useConversionNavigation } from './useConversionNavigation';

export function useConversionCore(
  selectedFile: File | null,
  extractedText: string,
  chapters: Chapter[],
  onStepComplete?: () => void
) {
  // Use required hooks
  const { showTerms, setShowTerms } = useTermsAndNotifications();
  const { 
    detectChapters, 
    setDetectChapters, 
    detectingChapters, 
    setDetectingChapters 
  } = useChaptersDetection();
  const { calculateEstimatedSeconds } = useConversionEstimation(extractedText);
  const { handleViewConversions } = useConversionNavigation();

  // Get conversion logic from the audio conversion hook
  const conversion = useAudioConversion();
  
  // Return all the data and functions needed
  return {
    // Terms
    showTerms,
    setShowTerms,
    
    // Chapters detection
    detectChapters, 
    setDetectChapters, 
    detectingChapters, 
    setDetectingChapters,
    
    // Conversion functions
    handleDownloadClick: conversion.handleDownload,
    handleViewConversions,
    calculateEstimatedSeconds,
    
    // Conversion state
    conversionStatus: conversion.conversionStatus,
    progress: conversion.progress,
    audioData: conversion.audioData,
    audioDuration: conversion.audioDuration,
    elapsedTime: conversion.elapsedTime || 0,
    conversionId: conversion.conversionId,
    
    // Conversion methods
    setProgress: conversion.setProgress,
    setConversionStatus: conversion.setConversionStatus,
    handleAcceptTerms: conversion.handleAcceptTerms,
    initiateConversion: conversion.initiateConversion,
    resetConversion: conversion.resetConversion,
  };
}
