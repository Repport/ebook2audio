import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useVoiceSettings } from './useVoiceSettings';
import { useProcessorUI } from './useProcessorUI';
import { useProcessorConversion } from './useProcessorConversion';
import { useConversionCore } from './useConversionCore';
import { useNavigate } from 'react-router-dom'; // Keep for handleGoBack if it navigates outside steps

import {
  Chapter,
  // ConversionOptions, // Not directly used by useProcessorLogic itself for options object
  UseConversionCoreReturn
} from '../../types/hooks/conversion';
import {
  UseProcessorLogicReturn,
  UseToastReturn // Used for toast property type
} from '../../types/hooks/processor';

// Props for the useProcessorLogic hook itself
interface ProcessorLogicProps {
  selectedFile: File | null;
  extractedText: string;
  chapters: Chapter[]; // These are initial chapters from props
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => void;
  currentStep: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onStepComplete?: () => void; // from useConversionCore
}

export const useProcessorLogic = (props: ProcessorLogicProps): UseProcessorLogicReturn => {
  const { toast } = useToast();
  const navigate = useNavigate(); // Retained if handleGoBack needs it

  const { 
    selectedFile, 
    extractedText, 
    chapters: initialChapters, // chapters from props are initial
    onNextStep, 
    currentStep,
    onPreviousStep,
    onFileSelect,
    onStepComplete
  } = props;
  
  // Internal state for this orchestrator hook
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters); // Manages current chapters
  const [isProcessingNextStep, setIsProcessingNextStep] = useState<boolean>(false); // UI feedback flag

  // Composed hooks
  const { activeTab, setActiveTab } = useProcessorUI();
  const { selectedVoice, setSelectedVoice, notifyOnComplete, setNotifyOnComplete } = useVoiceSettings();
  
  const conversionLogic: UseConversionCoreReturn = useConversionCore(
    selectedFile,
    extractedText,
    chapters, // Pass the current state of chapters to useConversionCore
    onStepComplete
  );

  const { 
    handleStartConversion,
    handleTermsAccept
  } = useProcessorConversion({
    selectedFile,
    extractedText,
    chapters, // Pass current state of chapters
    selectedVoice,
    notifyOnComplete,
    currentStep,
    showTerms: conversionLogic.showTerms,
    setShowTerms: conversionLogic.setShowTerms,
    onNextStep,
    startAudioConversionProcess: conversionLogic.startAudioConversionProcess,
    setIsProcessingGlobal: setIsProcessingNextStep, // Link to local processing flag
  });

  const handleGoBack = useCallback(() => {
    // Logic from original implementation using updated state sources
    if (conversionLogic.conversionStatus !== 'converting' && !conversionLogic.detectingChapters && !isProcessingNextStep) {
      if (currentStep > 1) {
        onPreviousStep();
      } else {
        // Potentially navigate or call onFileSelect(null) to go back to file selection
        conversionLogic.resetConversion();
        onFileSelect(null);
        // navigate('/'); // Example if navigating to root
      }
    } else {
      toast({
        title: "In Progress",
        description: "Please wait until the current process completes.",
        variant: "default",
      });
    }
  }, [
    currentStep, 
    onPreviousStep, 
    onFileSelect, 
    conversionLogic.resetConversion,
    conversionLogic.conversionStatus, 
    conversionLogic.detectingChapters,
    isProcessingNextStep,
    toast,
    // navigate // if navigate is used
  ]);

  return {
    // File and text state (props)
    selectedFile,
    extractedText,
    chapters, // Return current internal state of chapters

    // UI State
    activeTab,
    setActiveTab,

    // Voice Settings
    selectedVoice,
    setSelectedVoice,
    notifyOnComplete,
    setNotifyOnComplete,

    // Processing Flag
    isProcessingNextStep,

    // Core Conversion Logic
    conversionLogic,

    // Convenience accessors from conversionLogic
    showTerms: conversionLogic.showTerms,
    setShowTerms: conversionLogic.setShowTerms,
    detectChapters: conversionLogic.detectChapters,
    setDetectChapters: conversionLogic.setDetectChapters,
    detectingChapters: conversionLogic.detectingChapters,

    // Actions from useProcessorConversion
    handleStartConversion,
    handleTermsAccept,
    
    // Local Actions
    handleGoBack,
    resetConversion: conversionLogic.resetConversion,

    // Utilities
    toast: toast as UseToastReturn['toast'], // Cast to ensure type match
  };
};
