
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useConversionStore } from '@/store/conversionStore';
import { Chapter } from '@/utils/textExtraction';
import { useTermsAndNotifications } from './useTermsAndNotifications';
import { retryOperation, clearProcessedCache } from '@/services/conversion/utils/retryUtils';
import { ConversionOptions } from './useConversionActions';
import { LoggingService } from '@/utils/loggingService';

export function useConversionProcess() {
  const { toast } = useToast();
  const conversionStore = useConversionStore();
  const { handleNotificationSetup } = useTermsAndNotifications();
  
  const startConversion = useCallback(async (
    audioConversion: any,
    selectedFile: File | null,
    extractedText: string,
    options: ConversionOptions
  ) => {
    if (!selectedFile || !extractedText) {
      console.error('useConversionProcess - Missing file or text');
      return null;
    }
    
    // Clear any cached chunk data from previous conversions
    clearProcessedCache();
    
    // Log the start of conversion
    LoggingService.info('conversion', {
      message: 'Starting new conversion process',
      fileName: selectedFile.name,
      textLength: extractedText.length,
      voice: options.selectedVoice
    });
    
    // Establish state of conversion in both systems
    audioConversion.setConversionStatus('converting');
    audioConversion.setProgress(1);
    
    // Initialize store with initial data
    conversionStore.startConversion(selectedFile.name);
    
    try {
      console.log('useConversionProcess - Starting conversion with text length:', extractedText.length);
      
      // Clear existing errors and warnings
      conversionStore.clearErrors();
      conversionStore.clearWarnings();
      
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
        { 
          maxRetries: 1, // Reduce retries to avoid excessive reprocessing
          baseDelay: 1000,
          operation: 'Text-to-speech conversion',
          onBeforeRetry: async (error) => {
            // Notify user of retry
            toast({
              title: "Reintentando conversión",
              description: "Hubo un problema, estamos intentando nuevamente",
              variant: "default",
            });
            
            // Log retry attempt
            LoggingService.warn('conversion', {
              message: 'Retrying conversion due to error',
              error: error.message,
              fileName: selectedFile.name
            });
          }
        }
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
        title: "Conversión completada",
        description: "Tu archivo de audio está listo para descargar",
        variant: "success",
      });
      
      // Log successful completion
      LoggingService.info('conversion', {
        message: 'Conversion completed successfully',
        fileName: selectedFile.name,
        conversionId: result.id,
        audioSize: result.audio?.byteLength
      });
      
      return result;
    } catch (error: any) {
      console.error('useConversionProcess - Conversion error:', error);
      
      // Update status to error in both systems
      audioConversion.setConversionStatus('error');
      conversionStore.setError(error.message || "Error desconocido en la conversión");
      
      // Log the error
      LoggingService.error('conversion', {
        message: 'Conversion failed with error',
        error: error.message,
        fileName: selectedFile.name
      });
      
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error durante la conversión",
        variant: "destructive"
      });
      
      return null;
    }
  }, [conversionStore, toast, handleNotificationSetup]);
  
  return {
    startConversion
  };
}
