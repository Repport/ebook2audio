
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chapter } from '@/utils/textExtraction';
import { useToast } from '@/hooks/use-toast';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { useConversionProgress } from './useConversionProgress';
import { useConversionTerms } from './useConversionTerms';
import { useConversionNavigation } from './useConversionNavigation';
import { useConversionEstimation } from './useConversionEstimation';

export const useConversionCore = (
  selectedFile: File | null,
  extractedText: string,
  chapters: Chapter[],
  onStepComplete?: () => void
) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use our specialized hooks
  const audioConversion = useAudioConversion();
  const { showTerms, setShowTerms, checkTermsAcceptance } = 
    useConversionTerms();
  const { handleViewConversions } = 
    useConversionNavigation(navigate);
  const { calculateEstimatedSeconds } = 
    useConversionEstimation(extractedText);
  
  // Initialize the progress watcher
  const { watchConversionProgress } = useConversionProgress(
    selectedFile,
    audioConversion,
    onStepComplete
  );
  
  watchConversionProgress();
  
  // Return an object that fully implements the AudioConversionAPI interface
  return {
    // State
    conversionStatus: audioConversion.conversionStatus,
    progress: audioConversion.progress,
    audioData: audioConversion.audioData,
    audioDuration: audioConversion.audioDuration,
    elapsedTime: audioConversion.elapsedTime,
    conversionId: audioConversion.conversionId,
    
    // These methods need to be passed through from audioConversion
    handleConversion: audioConversion.handleConversion,
    handleDownload: audioConversion.handleDownload,
    
    // Removed chapter detection options
    
    // Terms dialog
    showTerms,
    setShowTerms,
    checkTermsAcceptance,
    
    // State setters
    setProgress: audioConversion.setProgress,
    setConversionStatus: audioConversion.setConversionStatus,
    resetConversion: audioConversion.resetConversion,
    
    // Methods from other hooks
    calculateEstimatedSeconds,
    handleViewConversions,
    
    // These will be implemented in the main useConversionLogic
    initiateConversion: () => Promise.resolve(false),
    handleAcceptTerms: async () => {},
    handleDownloadClick: () => {},
  };
};
