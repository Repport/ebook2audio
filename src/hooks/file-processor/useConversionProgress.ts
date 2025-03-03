
import { useEffect } from 'react';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';

export const useConversionProgress = (
  selectedFile: File | null,
  audioConversion: any,
  onStepComplete?: () => void
) => {
  const watchConversionProgress = () => {
    // Effect for resetting conversion when file changes
    useEffect(() => {
      const shouldReset = selectedFile && 
        (audioConversion.conversionStatus !== 'idle' || audioConversion.audioData !== null);
      
      if (shouldReset) {
        console.log('useConversionLogic - Resetting conversion state due to file change');
        audioConversion.resetConversion();
        clearConversionStorage();
      }
    }, [selectedFile, audioConversion.conversionStatus, audioConversion.audioData]); 

    // Effect for completing step
    useEffect(() => {
      if (audioConversion.conversionStatus === 'completed' && onStepComplete) {
        console.log('useConversionLogic - Conversion completed, calling onStepComplete');
        onStepComplete();
      }
    }, [audioConversion.conversionStatus, onStepComplete]);
    
    // Effect for resetting detectingChapters on error
    useEffect(() => {
      if (audioConversion.conversionStatus === 'error') {
        console.log('useConversionLogic - Error detected, resetting chapter detection');
      }
    }, [audioConversion.conversionStatus]);
  };
  
  return { watchConversionProgress };
};
