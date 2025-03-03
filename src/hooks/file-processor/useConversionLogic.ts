
import { useState, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import { useConversionCore } from './useConversionCore';
import { useConversionActions, ConversionOptions } from './useConversionActions';
import { Chapter } from '@/utils/textExtraction';

export type { ConversionOptions } from './useConversionActions';

export const useConversionLogic = (
  selectedFile: File | null,
  extractedText: string,
  chapters: Chapter[],
  onStepComplete?: () => void
) => {
  // Get core conversion functionality
  const core = useConversionCore(
    selectedFile,
    extractedText,
    chapters,
    onStepComplete
  );
  
  // Get conversion actions
  const actions = useConversionActions(
    selectedFile,
    extractedText,
    core,
    core.checkTermsAcceptance,
    core.setShowTerms,
    core.setDetectingChapters,
    core.detectChapters,
    chapters
  );
  
  return {
    // State from core
    conversionStatus: core.conversionStatus,
    progress: core.progress,
    audioData: core.audioData,
    audioDuration: core.audioDuration,
    elapsedTime: core.elapsedTime,
    conversionId: core.conversionId,
    
    // Options from core
    detectChapters: core.detectChapters,
    setDetectChapters: core.setDetectChapters,
    detectingChapters: core.detectingChapters,
    setDetectingChapters: core.setDetectingChapters,
    
    // Terms dialog from core
    showTerms: core.showTerms,
    setShowTerms: core.setShowTerms,
    
    // Actions from actions hook
    initiateConversion: actions.initiateConversion,
    handleAcceptTerms: actions.handleAcceptTerms,
    handleDownloadClick: actions.handleDownloadClick,
    
    // Navigation from core
    handleViewConversions: core.handleViewConversions,
    
    // Utility methods from core
    calculateEstimatedSeconds: core.calculateEstimatedSeconds,
    
    // State setters from core
    setProgress: core.setProgress,
    setConversionStatus: core.setConversionStatus,
    resetConversion: core.resetConversion
  };
};
