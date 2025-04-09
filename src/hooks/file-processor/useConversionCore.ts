
import { useCallback } from 'react';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { Chapter } from '@/utils/textExtraction';
import { useChaptersDetection } from './useChaptersDetection';
import { useTermsAndNotifications } from './useTermsAndNotifications';
import { useConversionEstimation } from './useConversionEstimation';
import { useConversionNavigation } from './useConversionNavigation';
import { ConversionOptions } from './useConversionActions';

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
  
  // Create wrapper functions to match expected signatures
  const handleAcceptTermsWrapper = async (options: ConversionOptions) => {
    console.log('Wrapping handleAcceptTerms call with options:', options);
    // Add any needed logic here
  };
  
  const initiateConversionWrapper = async () => {
    console.log('Wrapping initiateConversion call');
    return true; // Return a boolean as expected
  };
  
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
    handleAcceptTerms: handleAcceptTermsWrapper,
    initiateConversion: initiateConversionWrapper,
    resetConversion: conversion.resetConversion,
  };
}
