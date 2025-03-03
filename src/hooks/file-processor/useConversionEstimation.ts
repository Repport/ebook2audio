
import { useMemo } from 'react';

export const useConversionEstimation = (extractedText: string) => {
  const calculateEstimatedSeconds = useMemo(() => {
    if (!extractedText) return 0;

    const wordsCount = extractedText.split(/\s+/).length;
    const averageWordsPerMinute = 150;
    const baseProcessingTime = 5; // Minimum time in seconds
    
    const estimation = Math.ceil((wordsCount / averageWordsPerMinute) * 60 + baseProcessingTime);
    console.log('useConversionLogic - Estimated conversion time:', estimation, 'seconds');
    return estimation;
  }, [extractedText]);
  
  return { calculateEstimatedSeconds };
};
