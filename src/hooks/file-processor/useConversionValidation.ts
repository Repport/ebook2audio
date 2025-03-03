
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useConversionValidation() {
  const { toast } = useToast();
  
  const validateConversionParams = useCallback((
    selectedFile: File | null,
    extractedText: string,
    selectedVoice: string
  ) => {
    if (!selectedFile || !extractedText || !selectedVoice) {
      console.error('useConversionValidation - Missing required parameters:', {
        hasFile: !!selectedFile,
        hasText: !!extractedText,
        hasVoice: !!selectedVoice
      });
      
      toast({
        title: "Error",
        description: "Missing required data for conversion",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  }, [toast]);
  
  return {
    validateConversionParams
  };
}
