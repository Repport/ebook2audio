
import { useCallback } from 'react';
import { toast } from "@/hooks/use-toast";

interface NavigationProps {
  currentStep: number;
  onPreviousStep: () => void;
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: any[] } | null) => void;
  resetConversion: () => void;
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error';
  detectingChapters: boolean;
  isProcessingNextStep: boolean;
}

export function useProcessorNavigation({
  currentStep,
  onPreviousStep,
  onFileSelect,
  resetConversion,
  conversionStatus,
  detectingChapters,
  isProcessingNextStep
}: NavigationProps) {
  
  const handleGoBack = useCallback(() => {
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
  }, [
    currentStep, 
    onPreviousStep, 
    onFileSelect, 
    resetConversion, 
    conversionStatus, 
    detectingChapters, 
    isProcessingNextStep
  ]);
  
  return {
    handleGoBack
  };
}
