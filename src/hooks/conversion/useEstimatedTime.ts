
import { useMemo } from 'react';

export const useEstimatedTime = (extractedText: string) => {
  const estimatedSeconds = useMemo(() => {
    if (!extractedText) return 0;

    const wordsCount = extractedText.split(/\s+/).length;
    const averageWordsPerMinute = 150;
    const baseProcessingTime = 5; // Tiempo mínimo en segundos
    
    return Math.ceil((wordsCount / averageWordsPerMinute) * 60 + baseProcessingTime);
  }, [extractedText]);

  return {
    calculateEstimatedSeconds: () => estimatedSeconds
  };
};
