import { useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { UseProcessorConversionProps, UseProcessorConversionReturn } from '../../types/hooks/processor';
// ConversionOptions is used in the handleTermsAccept signature in the return type, but not directly in this file's logic
// However, the options for handleTermsAccept in UseProcessorConversionReturn is simplified to { selectedVoice: string; notifyOnComplete: boolean; }
// So, direct import of ConversionOptions might not be needed here unless used for other things.
// For now, let's assume it's not directly needed in the implementation body.

export function useProcessorConversion(props: UseProcessorConversionProps): UseProcessorConversionReturn {
  const {
    selectedFile,
    extractedText,
    chapters,
    selectedVoice,
    notifyOnComplete,
    currentStep,
    showTerms,
    setShowTerms,
    onNextStep,
    startAudioConversionProcess,
    setIsProcessingGlobal,
  } = props;

  const { toast } = useToast();

  const handleStartConversion = useCallback(async (): Promise<boolean> => {
    setIsProcessingGlobal(true); // Set at the beginning

    if (!selectedFile || !extractedText || !selectedVoice) {
      toast({
        title: "Error",
        description: "Missing required data for conversion (file, text, or voice).",
        variant: "destructive",
      });
      setIsProcessingGlobal(false);
      return false;
    }

    // If terms need to be shown (either because it's step 2 or showTerms is already true)
    if (currentStep === 2 || showTerms) {
      setShowTerms(true);
      setIsProcessingGlobal(false); // Not processing yet, waiting for terms
      return true; // Indicate that terms are now the next step
    }

    // Terms are accepted or not applicable for this step, proceed to actual conversion
    try {
      onNextStep(); // Move to the conversion progress step in UI
      await startAudioConversionProcess(
        extractedText,
        selectedVoice,
        chapters,
        selectedFile.name,
        // onProgress callback could be passed here if UseProcessorConversionProps included it
      );
      // Note: startAudioConversionProcess is expected to handle its own errors internally if it affects UI globally.
      // If it throws, the catch block here will handle it.
      // Success is implied if no error is thrown.
      setIsProcessingGlobal(false); // Conversion attempt finished
      return true; // Conversion process initiated successfully
    } catch (error: any) {
      console.error('Error in handleStartConversion during startAudioConversionProcess:', error);
      toast({
        title: "Conversion Error",
        description: error.message || "An unknown error occurred during conversion.",
        variant: "destructive",
      });
      setIsProcessingGlobal(false);
      return false; // Conversion initiation failed
    }
  }, [
    selectedFile,
    extractedText,
    selectedVoice,
    chapters,
    currentStep,
    showTerms,
    setShowTerms,
    onNextStep,
    startAudioConversionProcess,
    setIsProcessingGlobal,
    toast,
  ]);

  const handleTermsAccept = useCallback(async (options: { selectedVoice: string; notifyOnComplete: boolean; }): Promise<void> => {
    setIsProcessingGlobal(true);
    setShowTerms(false);
    
    // It's assumed that currentStep is already 3 (conversion step) or onNextStep() will take us there.
    // If currentStep was 2, onNextStep() should be called before this point or as part of this.
    // The problem description says "Call props.onNextStep()" for handleTermsAccept.
    onNextStep();

    try {
      await startAudioConversionProcess(
        extractedText,
        options.selectedVoice, // Use voice from options passed to handleTermsAccept
        chapters,
        selectedFile?.name,
        // onProgress callback
        // options.notifyOnComplete // This needs to be mapped to onProgress or similar if applicable,
                                  // or used by the caller after this promise resolves.
                                  // For now, assume notifyOnComplete is handled by the caller or via onProgress.
      );
      // Success implied if no error.
    } catch (error: any) {
      console.error('Error in handleTermsAccept during startAudioConversionProcess:', error);
      toast({
        title: "Conversion Error",
        description: error.message || "An unknown error occurred after accepting terms.",
        variant: "destructive",
      });
      // Even if conversion fails, terms were accepted. The error is in processing.
    } finally {
      setIsProcessingGlobal(false);
    }
  }, [
    extractedText,
    chapters,
    selectedFile,
    // selectedVoice, // Voice comes from `options` in this function
    // notifyOnComplete, // notifyOnComplete comes from `options`
    setShowTerms,
    onNextStep,
    startAudioConversionProcess,
    setIsProcessingGlobal,
    toast,
  ]);

  return {
    handleStartConversion,
    handleTermsAccept,
  };
}
