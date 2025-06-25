
import { useCallback } from 'react';

export const useConversionEstimation = (extractedText: string) => {
  const calculateEstimatedSeconds = useCallback(() => {
    if (!extractedText) return 0;
    // Estimate based on ~15 characters per second of speech
    return Math.ceil(extractedText.length / 15);
  }, [extractedText]);

  return {
    calculateEstimatedSeconds
  };
};
