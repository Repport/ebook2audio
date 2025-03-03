
import { useConversionCore } from '@/hooks/file-processor/useConversionCore';
import { useConversionActions, ConversionOptions } from '@/hooks/file-processor/useConversionActions';

export type { ConversionOptions } from '@/hooks/file-processor/useConversionActions';

export const useConversionLogic = (
  selectedFile: File | null,
  extractedText: string,
  chapters: any[],
  onStepComplete?: () => void
) => {
  // Get core conversion functionality
  const core = useConversionCore(
    selectedFile,
    extractedText,
    chapters,
    onStepComplete
  );
  
  // Get conversion actions - pass the full core object which now implements AudioConversionAPI
  const actions = useConversionActions(
    selectedFile,
    extractedText,
    {
      conversionStatus: core.conversionStatus,
      progress: core.progress,
      audioData: core.audioData,
      audioDuration: core.audioDuration,
      elapsedTime: core.elapsedTime,
      conversionId: core.conversionId,
      setProgress: core.setProgress,
      setConversionStatus: core.setConversionStatus,
      resetConversion: core.resetConversion,
      handleConversion: core.handleConversion,
      handleDownload: core.handleDownload
    },
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
