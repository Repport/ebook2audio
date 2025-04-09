
import { useCallback } from 'react';

export function useConversionEstimation(text: string) {
  // Function to estimate conversion time based on text length
  const calculateEstimatedSeconds = useCallback(() => {
    if (!text) return 0;
    
    // Average reading speed is about 150 words per minute (2.5 words per second)
    // Average word has 5 characters
    const characterCount = text.length;
    const estimatedWordCount = characterCount / 5;
    
    // Add overhead for processing time (30 seconds base + 1 second per 1000 characters)
    const processingOverhead = 30 + (characterCount / 1000);
    
    // Calculate total estimated seconds
    const estimatedSeconds = (estimatedWordCount / 2.5) + processingOverhead;
    
    return Math.round(estimatedSeconds);
  }, [text]);
  
  return {
    calculateEstimatedSeconds
  };
}
