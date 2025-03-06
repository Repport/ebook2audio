
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useConversionStore } from '@/store/conversionStore';
import { Chapter } from '@/utils/textExtraction';
import { useTermsAndNotifications } from './useTermsAndNotifications';
import { retryOperation } from '@/services/conversion/utils/retryUtils';
import { ConversionOptions } from './useConversionActions';

export function useConversionProcess() {
  const { toast } = useToast();
  const conversionStore = useConversionStore();
  const { handleNotificationSetup } = useTermsAndNotifications();
  
  const startConversion = useCallback(async (
    audioConversion: any,
    selectedFile: File | null,
    extractedText: string,
    options: ConversionOptions,
    detectChapters: boolean, // Keep param for compatibility
    chapters: Chapter[] // Keep param for compatibility
  ) => {
    if (!selectedFile || !extractedText) {
      console.error('useConversionProcess - Missing file or text');
      return null;
    }
    
    // Establish state of conversion in both systems
    audioConversion.setConversionStatus('converting');
    audioConversion.setProgress(1);
    
    // Initialize store with initial data
    conversionStore.startConversion(selectedFile.name);
    
    try {
      console.log('useConversionProcess - Starting conversion with text length:', extractedText.length);
      
      // Use retry mechanism to handle conversion errors
      const result = await retryOperation(
        async () => {
          return await audioConversion.handleConversion(
            extractedText,
            options.selectedVoice,
            false, // No chapter detection
            [], // No chapters
            selectedFile.name,
            (data: any) => {
              // Also update global store
              conversionStore.updateProgress(data);
            }
          );
        },
        { maxRetries: 2, baseDelay: 1000 }
      );
      
      if (!result) {
        console.error('useConversionProcess - Conversion failed or was cancelled');
        throw new Error('La conversión falló o fue cancelada');
      }
      
      console.log('useConversionProcess - Conversion result received:', result);
      
      // Ensure status is updated to completed in both systems
      audioConversion.setConversionStatus('completed');
      audioConversion.setProgress(100);
      
      // Update global store with result
      conversionStore.completeConversion(
        result.audio, 
        result.id,
        Math.ceil(extractedText.length / 15) // Approximate duration
      );
      
      // Handle notification setup if enabled
      await handleNotificationSetup(options.notifyOnComplete || false, result.id);
      
      console.log('useConversionProcess - Conversion completed successfully');
      
      // Show completion toast
      toast({
        title: "Conversion complete",
        description: "Your audio file is ready to download",
        variant: "success",
      });
      
      return result;
    } catch (error: any) {
      console.error('useConversionProcess - Conversion error:', error);
      
      // Update status to error in both systems
      audioConversion.setConversionStatus('error');
      conversionStore.setError(error.message || "Error desconocido en la conversión");
      
      toast({
        title: "Error",
        description: error.message || "An error occurred during conversion",
        variant: "destructive"
      });
      
      return null;
    }
  }, [conversionStore, toast, handleNotificationSetup]);
  
  return {
    startConversion
  };
}
