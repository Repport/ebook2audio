
import { useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import { ConversionOptions } from './useConversionActions';

export const useConversionProcess = () => {
  const startConversion = useCallback(async (
    audioConversion: any,
    selectedFile: File | null,
    extractedText: string,
    options: ConversionOptions
  ) => {
    if (!selectedFile || !extractedText) {
      console.error('useConversionProcess - Missing file or text');
      toast({
        title: "Error",
        description: "Missing required data for conversion",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('useConversionProcess - Starting conversion with options:', options);
      
      // Create progress handler
      const handleProgress = (progress: number) => {
        console.log(`Conversion progress: ${progress}%`);
      };
      
      // Start the conversion
      const result = await audioConversion.handleConversion(
        extractedText,
        options.selectedVoice,
        handleProgress,
        [], // Empty chapters array
        selectedFile.name
      );
      
      return result;
    } catch (error) {
      console.error('useConversionProcess - Error during conversion:', error);
      toast({
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  }, []);

  return {
    startConversion
  };
};
