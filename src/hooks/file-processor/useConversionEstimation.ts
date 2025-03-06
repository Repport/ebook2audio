
import { useMemo } from 'react';

export const useConversionEstimation = (extractedText: string) => {
  // Create a memoized calculation function
  const calculateEstimatedSeconds = useMemo(() => {
    // Return a function that can be called when needed
    return () => {
      if (!extractedText) return 0;

      const wordsCount = extractedText.split(/\s+/).length;
      const averageWordsPerMinute = 150;
      const baseProcessingTime = 5; // Minimum time in seconds
      
      const estimation = Math.ceil((wordsCount / averageWordsPerMinute) * 60 + baseProcessingTime);
      return estimation;
    };
  }, [extractedText]);
  
  return { calculateEstimatedSeconds };
};
