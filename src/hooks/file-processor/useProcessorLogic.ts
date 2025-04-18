
import { useCallback, useState } from 'react';
import { Chapter } from '@/utils/textExtraction';
import { useToast } from '@/hooks/use-toast';
import { useFileProcessor } from '@/context/FileProcessorContext';
import { useVoiceSettings } from './useVoiceSettings';
import { useProcessorUI } from './useProcessorUI';
import { ConversionOptions } from './useConversionActions';
import { useProcessorConversion } from './useProcessorConversion';
import { useConversionCore } from './useConversionCore';
import { useNavigate } from 'react-router-dom';

// Define a proper interface for the props
interface ProcessorLogicProps {
  selectedFile: File | null;
  extractedText: string;
  chapters: Chapter[];
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => void;
  currentStep: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onStepComplete?: () => void;
}

export interface ProcessorLogicType {
  selectedFile: File | null;
  extractedText: string;
  chapters: Chapter[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentStep: number;
  goToNextTab: () => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  notifyOnComplete: boolean;
  setNotifyOnComplete: (notify: boolean) => void;
  showTerms: boolean;
  setShowTerms: (show: boolean) => void;
  isProcessingNextStep: boolean;
  setIsProcessingNextStep: (isProcessing: boolean) => void;
  detectChapters: boolean;
  setDetectChapters: (detect: boolean) => void;
  detectingChapters: boolean;
  conversionLogic: any;
  toast: any;
}

export const useProcessorLogic = (props: ProcessorLogicProps) => {
  const { toast } = useToast();
  const [isProcessingNextStep, setIsProcessingNextStep] = useState<boolean>(false);
  const navigate = useNavigate();
  
  // Extract props
  const { 
    selectedFile, 
    extractedText, 
    chapters, 
    onNextStep, 
    currentStep,
    onPreviousStep,
    onFileSelect,
    onStepComplete
  } = props;
  
  // Get UI state
  const { activeTab, setActiveTab } = useProcessorUI();
  
  // Get voice settings
  const { selectedVoice, setSelectedVoice, notifyOnComplete, setNotifyOnComplete } = useVoiceSettings();
  
  // Get conversion logic using our specialized hook
  const conversionLogic = useConversionCore(
    selectedFile,
    extractedText,
    chapters,
    onStepComplete
  );
  
  // Extract these properties explicitly from conversionLogic for TypeScript
  const {
    showTerms,
    setShowTerms,
    detectChapters,
    setDetectChapters,
    detectingChapters,
    resetConversion
  } = conversionLogic;
  
  // Create a fixed handleTermsAccept function with proper typing
  const handleTermsAccept = async (options: ConversionOptions): Promise<void> => {
    if (conversionLogic.handleAcceptTerms) {
      await conversionLogic.handleAcceptTerms(options);
    }
  };
  
  // Setup conversion logic handlers
  const { 
    handleStartConversion
  } = useProcessorConversion({
    selectedFile,
    extractedText,
    selectedVoice,
    isProcessingNextStep,
    setIsProcessingNextStep,
    detectingChapters,
    setDetectChapters,
    onNextStep,
    showTerms,
    setShowTerms,
    initiateConversion: conversionLogic.initiateConversion,
    handleAcceptTerms: handleTermsAccept, 
    currentStep,
    notifyOnComplete
  });
  
  // Handle navigation
  const handleGoBack = useCallback(() => {
    console.log('ProcessorLogic - handleGoBack called');
    
    if (conversionLogic.conversionStatus !== 'converting' && !detectingChapters && !isProcessingNextStep) {
      if (currentStep > 1) {
        console.log('ProcessorLogic - Going to previous step');
        onPreviousStep();
      } else {
        console.log('ProcessorLogic - Returning to file selection');
        resetConversion();
        onFileSelect(null);
      }
    } else {
      console.log('ProcessorLogic - Cannot go back during conversion or chapter detection');
      
      toast({
        title: "In Progress",
        description: "Please wait until the current process completes",
        variant: "default",
      });
    }
  }, [
    currentStep, 
    onPreviousStep, 
    onFileSelect, 
    resetConversion, 
    conversionLogic.conversionStatus, 
    detectingChapters, 
    isProcessingNextStep,
    toast
  ]);
  
  // Function to move to the next tab
  const goToNextTab = useCallback(() => {
    if (activeTab === "file-info") {
      setActiveTab("voice-settings");
    } else if (activeTab === "voice-settings") {
      setActiveTab("conversion");
    }
  }, [activeTab, setActiveTab]);

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
    
    // Processing state
    isProcessingNextStep,
    setIsProcessingNextStep,
    detectChapters,
    setDetectChapters,
    detectingChapters,
    
    // Conversion actions
    handleStartConversion,
    handleTermsAccept,
    handleGoBack,
    resetConversion,
    
    // Conversion state
    conversionLogic,
    toast
  };
};
