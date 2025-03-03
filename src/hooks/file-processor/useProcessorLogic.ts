
import { useState, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import { useConversionLogic } from '@/components/file-processor/useConversionLogic';
import { Chapter } from '@/utils/textExtraction';

interface ProcessorLogicProps {
  selectedFile: File;
  extractedText: string;
  chapters: Chapter[];
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => void;
  currentStep: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
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
}: ProcessorLogicProps & { onStepComplete?: () => void }) => {
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [notifyOnComplete, setNotifyOnComplete] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("file-info");
  const [isProcessingNextStep, setIsProcessingNextStep] = useState(false);

  const conversionLogic = useConversionLogic(selectedFile, extractedText, chapters, onStepComplete);
  const {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    showTerms,
    setShowTerms,
    conversionStatus,
    resetConversion,
    initiateConversion,
    handleAcceptTerms
  } = conversionLogic;

  const handleStartConversion = useCallback(async () => {
    console.log('ProcessorLogic - handleStartConversion called');
    
    if (isProcessingNextStep) {
      console.log('ProcessorLogic - Already processing, ignoring request');
      return false;
    }
    
    setIsProcessingNextStep(true);
    
    try {
      if (!selectedFile || !extractedText || !selectedVoice) {
        console.log('ProcessorLogic - Missing required data for conversion', {
          hasFile: !!selectedFile,
          hasText: !!extractedText,
          selectedVoice
        });
        
        toast({
          title: "Error",
          description: "Missing required data for conversion",
          variant: "destructive",
        });
        
        setIsProcessingNextStep(false);
        return false;
      }

      if (detectingChapters) {
        setDetectChapters(false);
      }

      const canConvert = await initiateConversion();
      if (!canConvert) {
        console.log('ProcessorLogic - initiateConversion returned false');
        
        toast({
          title: "Error",
          description: "Unable to initiate conversion",
          variant: "destructive",
        });
        
        setIsProcessingNextStep(false);
        return false;
      }

      if (showTerms) {
        console.log('ProcessorLogic - Terms will be shown');
        return true;
      }

      console.log('ProcessorLogic - Starting conversion directly');
      onNextStep();
      
      await handleAcceptTerms({
        selectedVoice,
        notifyOnComplete
      });

      return true;
    } catch (error) {
      console.error('ProcessorLogic - Error in handleStartConversion:', error);
      
      toast({
        title: "Error",
        description: "An error occurred during conversion",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsProcessingNextStep(false);
    }
  }, [
    isProcessingNextStep, selectedFile, extractedText, selectedVoice, 
    detectingChapters, setDetectChapters, initiateConversion, showTerms, 
    handleAcceptTerms, notifyOnComplete, onNextStep
  ]);

  const handleTermsAccept = async () => {
    console.log('ProcessorLogic - Terms accepted');
    setShowTerms(false);
    
    try {
      if (currentStep === 2) {
        console.log('ProcessorLogic - Moving to next step after terms acceptance');
        onNextStep();
      }
      
      await handleAcceptTerms({
        selectedVoice,
        notifyOnComplete
      });
    } catch (error) {
      console.error('ProcessorLogic - Error in handleTermsAccept:', error);
      
      toast({
        title: "Error",
        description: "An error occurred while accepting terms",
        variant: "destructive",
      });
    } finally {
      setIsProcessingNextStep(false);
    }
  };

  const handleGoBack = () => {
    console.log('ProcessorLogic - handleGoBack called, conversionStatus:', conversionStatus);
    if (conversionStatus !== 'converting' && !detectingChapters && !isProcessingNextStep) {
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
  };

  return {
    // State
    selectedVoice,
    setSelectedVoice,
    notifyOnComplete,
    setNotifyOnComplete,
    activeTab,
    setActiveTab,
    isProcessingNextStep,
    
    // Conversion logic
    conversionLogic,
    detectChapters,
    setDetectChapters,
    detectingChapters,
    showTerms,
    setShowTerms,
    
    // Actions
    handleStartConversion,
    handleTermsAccept,
    handleGoBack,
    resetConversion
  };
};
