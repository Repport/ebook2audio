
import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useVoiceSettings } from './useVoiceSettings';
import { useProcessorUI } from './useProcessorUI';
import { useProcessorConversion } from './useProcessorConversion';
import { useConversionCore } from './useConversionCore';
import { useNavigate } from 'react-router-dom';

import {
  Chapter,
  UseConversionCoreReturn
} from '../../types/hooks/conversion';
import {
  UseProcessorLogicReturn,
  UseToastReturn
} from '../../types/hooks/processor';

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

export const useProcessorLogic = (props: ProcessorLogicProps): UseProcessorLogicReturn => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const { 
    selectedFile, 
    extractedText, 
    chapters: initialChapters,
    onNextStep, 
    currentStep,
    onPreviousStep,
    onFileSelect,
    onStepComplete
  } = props;
  
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [isProcessingNextStep, setIsProcessingNextStep] = useState<boolean>(false);

  const { activeTab, setActiveTab, goToNextTab } = useProcessorUI();
  const { selectedVoice, setSelectedVoice, notifyOnComplete, setNotifyOnComplete } = useVoiceSettings();
  
  const conversionLogic: UseConversionCoreReturn = useConversionCore(
    selectedFile,
    extractedText,
    chapters,
    onStepComplete
  );

  const { 
    handleStartConversion,
    handleTermsAccept
  } = useProcessorConversion({
    selectedFile,
    extractedText,
    chapters,
    selectedVoice,
    notifyOnComplete,
    currentStep,
    showTerms: conversionLogic.showTerms,
    setShowTerms: conversionLogic.setShowTerms,
    onNextStep,
    startAudioConversionProcess: conversionLogic.startAudioConversionProcess,
    setIsProcessingGlobal: setIsProcessingNextStep,
  });

  const handleGoBack = useCallback(() => {
    if (conversionLogic.conversionStatus !== 'converting' && !conversionLogic.detectingChapters && !isProcessingNextStep) {
      if (currentStep > 1) {
        onPreviousStep();
      } else {
        conversionLogic.resetConversion();
        onFileSelect(null);
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
  ]);

  return {
    selectedFile,
    extractedText,
    chapters,
    activeTab,
    setActiveTab,
    selectedVoice,
    setSelectedVoice,
    notifyOnComplete,
    setNotifyOnComplete,
    isProcessingNextStep,
    conversionLogic,
    showTerms: conversionLogic.showTerms,
    setShowTerms: conversionLogic.setShowTerms,
    detectChapters: conversionLogic.detectChapters,
    setDetectChapters: conversionLogic.setDetectChapters,
    detectingChapters: conversionLogic.detectingChapters,
    handleStartConversion,
    handleTermsAccept,
    handleGoBack,
    resetConversion: conversionLogic.resetConversion,
    toast: toast as UseToastReturn['toast'],
    goToNextTab, // Añadido para resolver el error
  };
};
