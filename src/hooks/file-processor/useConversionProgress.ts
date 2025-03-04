
import { useEffect, useRef } from 'react';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';

export const useConversionProgress = (
  selectedFile: File | null,
  audioConversion: any,
  onStepComplete?: () => void
) => {
  // Use ref to track if onStepComplete has been called for current conversion
  const completionCalledRef = useRef(false);
  // Track previous conversion status
  const previousStatusRef = useRef(audioConversion.conversionStatus);

  const watchConversionProgress = () => {
    // Effect for resetting conversion when file changes
    useEffect(() => {
      const shouldReset = selectedFile && 
        (audioConversion.conversionStatus !== 'idle' || audioConversion.audioData !== null);
      
      if (shouldReset) {
        console.log('useConversionLogic - Resetting conversion state due to file change');
        audioConversion.resetConversion();
        clearConversionStorage();
        // Reset completion flag when file changes
        completionCalledRef.current = false;
      }
    }, [selectedFile]); // Remove dependencies that cause re-renders

    // Effect for completing step
    useEffect(() => {
      // Only call onStepComplete once when status changes to completed
      const currentStatus = audioConversion.conversionStatus;
      const previousStatus = previousStatusRef.current;
      
      if (currentStatus === 'completed' && 
          previousStatus !== 'completed' && 
          onStepComplete && 
          !completionCalledRef.current) {
        console.log('useConversionLogic - Conversion completed, calling onStepComplete');
        completionCalledRef.current = true;
        onStepComplete();
      }
      
      // Update previous status ref
      previousStatusRef.current = currentStatus;
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
