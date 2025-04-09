
import { useCallback, useState } from 'react';
import { Chapter } from '@/utils/textExtraction';
import { useToast } from '@/hooks/use-toast';
import { useFileProcessor } from '@/context/FileProcessorContext';
import { useProcessorNavigation } from './useProcessorNavigation';
import { useVoiceSettings } from './useVoiceSettings';
import { useTermsAndNotifications } from './useTermsAndNotifications';
import { useProcessorConversion } from './useProcessorConversion';
import { useProcessorUI } from './useProcessorUI';
import { ConversionOptions } from './useConversionActions';

export const useProcessorLogic = () => {
  const { toast } = useToast();
  const [isProcessingNextStep, setIsProcessingNextStep] = useState(false);
  
  // Access file processor context
  const { 
    selectedFile, 
    extractedText, 
    chapters, 
    onNextStep, 
    currentStep 
  } = useFileProcessor();
  
  // Get processor hooks
  const { activeTab, setActiveTab, goToNextTab } = useProcessorNavigation(currentStep);
  const { selectedVoice, setSelectedVoice, notifyOnComplete, setNotifyOnComplete } = useVoiceSettings();
  const { showTerms, setShowTerms, hasAcceptedTerms, setHasAcceptedTerms } = useTermsAndNotifications();
  const { isDetectingChapters, setIsDetectingChapters, detectChapters, setDetectChapters } = useProcessorUI();
  
  // Get conversion logic
  const conversionLogic = {
    conversionStatus: 'idle',
    progress: 0,
    audioData: null,
    audioDuration: 0,
    elapsedTime: 0,
    initiateConversion: () => Promise.resolve(false),
    handleAcceptTerms: (options: ConversionOptions) => Promise.resolve(),
    handleDownloadClick: () => {},
    handleViewConversions: () => {},
    calculateEstimatedSeconds: () => 0,
    conversionId: null,
    setProgress: () => {},
    setConversionStatus: () => {},
    resetConversion: () => {},
    detectChapters,
    setDetectChapters,
    detectingChapters: isDetectingChapters,
    showTerms,
    setShowTerms
  };

  // Setup conversion logic handlers
  const { 
    handleStartConversion,
    handleTermsAccept
  } = useProcessorConversion({
    selectedFile,
    extractedText,
    selectedVoice,
    isProcessingNextStep,
    setIsProcessingNextStep,
    detectingChapters: isDetectingChapters,
    setDetectChapters,
    onNextStep,
    showTerms,
    setShowTerms,
    initiateConversion: conversionLogic.initiateConversion,
    handleAcceptTerms: conversionLogic.handleAcceptTerms,
    currentStep,
    notifyOnComplete
  });

  return {
    // File upload form state
    selectedFile,
    extractedText,
    chapters,
    
    // Navigation state
    activeTab,
    setActiveTab,
    currentStep,
    goToNextTab,
    
    // Voice settings
    selectedVoice,
    setSelectedVoice,
    notifyOnComplete,
    setNotifyOnComplete,
    
    // Terms
    showTerms,
    setShowTerms,
    hasAcceptedTerms,
    setHasAcceptedTerms,
    
    // Processing state
    isProcessingNextStep,
    setIsProcessingNextStep,
    detectChapters,
    setDetectChapters,
    isDetectingChapters,
    setIsDetectingChapters,
    
    // Conversion actions
    handleStartConversion,
    handleTermsAccept,
    
    // Conversion state
    conversionLogic,
    toast
  };
};
