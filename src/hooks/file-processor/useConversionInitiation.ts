
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useConversionStore } from '@/store/conversionStore';
import { LoggingService } from '@/utils/loggingService';

export function useConversionInitiation() {
  const { toast } = useToast();
  const conversionStore = useConversionStore();

  const startInitialization = useCallback(async (fileName: string | null) => {
    try {
      // Initialize store with initial data
      conversionStore.startConversion(fileName);

      // Clear existing errors and warnings
      conversionStore.clearErrors();
      conversionStore.clearWarnings();
      
      return true;
    } catch (error: any) {
      console.error("Failed to initialize conversion:", error);
      
      // Log the error
      LoggingService.warn('conversion', {
        message: 'Failed to initialize conversion',
        error: error.message
      });
      
      toast({
        title: "Initialization Error",
        description: error.message || "Could not initialize conversion",
        variant: "destructive"
      });
      
      return false;
    }
  }, [conversionStore, toast]);
  
  return {
    startInitialization
  };
}
