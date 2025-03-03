
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { Chapter } from '@/utils/textExtraction';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { retryOperation } from '@/services/conversion/utils/retryUtils';
import { ChunkProgressData } from '@/services/conversion/types/chunks';
import { useConversionCore } from '@/hooks/file-processor/useConversionCore';
import { useConversionActions, ConversionOptions } from '@/hooks/file-processor/useConversionActions';

export { ConversionOptions } from '@/hooks/file-processor/useConversionActions';

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
    {
      conversionStatus: core.conversionStatus,
      progress: core.progress,
      audioData: core.audioData,
      setConversionStatus: core.setConversionStatus,
      setProgress: core.setProgress,
      handleConversion: core.handleConversion,
      handleDownload: core.handleDownload,
      resetConversion: core.resetConversion
    },
    async () => true, // Mock checkTermsAcceptance for now
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
    calculateEstimatedSeconds: () => core.calculateEstimatedSeconds,
    
    // State setters from core
    setProgress: core.setProgress,
    setConversionStatus: core.setConversionStatus,
    resetConversion: core.resetConversion
  };
};
