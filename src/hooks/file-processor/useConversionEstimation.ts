
import { useMemo } from 'react';

export const useConversionEstimation = (extractedText: string) => {
  // This was incorrectly returning a number when a function was expected
  // Let's return a function that returns the calculated number
  const calculateEstimatedSeconds = () => {
    if (!extractedText) return 0;

    const wordsCount = extractedText.split(/\s+/).length;
    const averageWordsPerMinute = 150;
    const baseProcessingTime = 5; // Minimum time in seconds
    
    const estimation = Math.ceil((wordsCount / averageWordsPerMinute) * 60 + baseProcessingTime);
    console.log('useConversionLogic - Estimated conversion time:', estimation, 'seconds');
    return estimation;
  };
  
  return { calculateEstimatedSeconds };
};
