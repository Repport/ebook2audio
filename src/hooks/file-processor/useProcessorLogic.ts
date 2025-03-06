
import { Chapter } from '@/utils/textExtraction';
import { useConversionLogic } from '@/components/file-processor/useConversionLogic';
import { useVoiceSettings } from './useVoiceSettings';
import { useProcessorUI } from './useProcessorUI';
import { useProcessorNavigation } from './useProcessorNavigation';
import { useProcessorConversion } from './useProcessorConversion';

interface ProcessorLogicProps {
  selectedFile: File;
  extractedText: string;
  chapters: Chapter[];
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => void;
  currentStep: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onStepComplete?: () => void;
}

export const useProcessorLogic = ({
  selectedFile,
  extractedText,
  chapters,
  onFileSelect,
  currentStep,
  onNextStep,
  onPreviousStep,
  onStepComplete
}: ProcessorLogicProps) => {
  // Use our smaller, focused hooks
  const { 
    selectedVoice, 
    setSelectedVoice,
    notifyOnComplete, 
    setNotifyOnComplete 
  } = useVoiceSettings();
  
  const { 
    activeTab, 
    setActiveTab,
    isProcessingNextStep, 
    setIsProcessingNextStep 
  } = useProcessorUI();

  // Get conversion logic from existing hook
  const conversionLogic = useConversionLogic(selectedFile, extractedText, chapters, onStepComplete);
  const {
    conversionStatus,
    resetConversion,
    showTerms,
    setShowTerms,
    initiateConversion,
    handleAcceptTerms
  } = conversionLogic;

  // Use navigation hook
  const { handleGoBack } = useProcessorNavigation({
    currentStep,
    onPreviousStep,
    onFileSelect,
    resetConversion,
    conversionStatus,
    detectingChapters: false, // Removed chapter detection
    isProcessingNextStep
  });

  // Use conversion actions hook
  const { 
    handleStartConversion, 
    handleTermsAccept 
  } = useProcessorConversion({
    selectedFile,
    extractedText,
    selectedVoice,
    isProcessingNextStep,
    setIsProcessingNextStep,
    detectingChapters: false, // Removed chapter detection
    setDetectChapters: () => {}, // Empty function
    onNextStep,
    showTerms,
    setShowTerms,
    initiateConversion,
    handleAcceptTerms,
    currentStep,
    notifyOnComplete
  });

  // Return all the state and handlers
  return {
    // Voice settings
    selectedVoice,
    setSelectedVoice,
    notifyOnComplete,
    setNotifyOnComplete,
    
    // UI state
    activeTab,
    setActiveTab,
    isProcessingNextStep,
    
    // Conversion logic
    conversionLogic,
    detectChapters: false, // Removed chapter detection
    setDetectChapters: () => {}, // Empty function
    detectingChapters: false, // Removed chapter detection
    showTerms,
    setShowTerms,
    
    // Actions
    handleStartConversion,
    handleTermsAccept,
    handleGoBack,
    resetConversion
  };
};
