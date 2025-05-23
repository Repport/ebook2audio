
import { useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ConversionOptions } from './useConversionActions';

interface ConversionActionsProps {
  selectedFile: File | null;
  extractedText: string;
  selectedVoice: string;
  isProcessingNextStep: boolean;
  setIsProcessingNextStep: (isProcessing: boolean) => void;
  detectingChapters: boolean;
  setDetectChapters: (detect: boolean) => void;
  onNextStep: () => void;
  showTerms: boolean;
  setShowTerms: (show: boolean) => void;
  initiateConversion: () => Promise<boolean>;
  handleAcceptTerms: (options: ConversionOptions) => Promise<void>;
  currentStep: number;
  notifyOnComplete: boolean;
}

export function useProcessorConversion({
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
  initiateConversion,
  handleAcceptTerms,
  currentStep,
  notifyOnComplete
}: ConversionActionsProps) {
  
  const { toast } = useToast();
  
  const handleStartConversion = useCallback(async () => {
    console.log('ProcessorLogic - handleStartConversion called', {
      currentStep,
      hasFile: !!selectedFile,
      hasText: !!extractedText,
      selectedVoice,
      isProcessing: isProcessingNextStep
    });
    
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

      console.log('ProcessorLogic - Initiating conversion...');
      const canConvert = await initiateConversion();
      console.log('ProcessorLogic - initiateConversion result:', canConvert);
      
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

      // Always show terms on the first conversion
      if (currentStep === 2 || showTerms) {
        console.log('ProcessorLogic - Terms will be shown');
        // Set isProcessingNextStep to false since we're waiting for terms acceptance
        setIsProcessingNextStep(false);
        // DON'T move to next step until terms are accepted
        setShowTerms(true);
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
    isProcessingNextStep, 
    selectedFile, 
    extractedText, 
    selectedVoice,
    detectingChapters, 
    setDetectChapters, 
    initiateConversion, 
    showTerms,
    handleAcceptTerms, 
    notifyOnComplete, 
    onNextStep, 
    currentStep,
    setIsProcessingNextStep,
    setShowTerms,
    toast
  ]);

  const handleTermsAccept = useCallback(async (options: ConversionOptions) => {
    console.log('ProcessorLogic - Terms accepted');
    setShowTerms(false);
    
    try {
      setIsProcessingNextStep(true);
      
      if (currentStep === 2) {
        console.log('ProcessorLogic - Moving to next step after terms acceptance');
        onNextStep();
      }
      
      // Only start the conversion after terms are accepted
      await handleAcceptTerms(options);
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
  }, [
    setShowTerms,
    currentStep,
    onNextStep,
    handleAcceptTerms,
    setIsProcessingNextStep,
    toast
  ]);
  
  return {
    handleStartConversion,
    handleTermsAccept
  };
}
