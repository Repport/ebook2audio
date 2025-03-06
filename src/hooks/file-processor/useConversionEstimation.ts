
import { useMemo } from 'react';

export const useConversionEstimation = (extractedText: string) => {
  // Memoize the calculation function to avoid unnecessary recreations
  return useMemo(() => {
    // Return an object with a function that can be called when needed
    return {
      calculateEstimatedSeconds: () => {
        if (!extractedText) return 0;

        const wordsCount = extractedText.split(/\s+/).length;
        const charactersCount = extractedText.length;
        
        // Better estimates based on real data
        // 150 words per minute (2.5 words per second)
        const wordBasedEstimate = Math.ceil(wordsCount / 2.5);
        
        // Approximately 15 characters per second for speech synthesis
        const charBasedEstimate = Math.ceil(charactersCount / 15);
        
        // Base processing time plus the greater of the estimates
        const baseProcessingTime = 10; // Minimum time in seconds
        const finalEstimate = baseProcessingTime + Math.max(wordBasedEstimate, charBasedEstimate);
        
        console.log('Estimated conversion time:', {
          words: wordsCount,
          characters: charactersCount,
          wordBasedEstimate,
          charBasedEstimate,
          finalEstimate
        });
        
        return finalEstimate;
      }
    };
  }, [extractedText]);
};
