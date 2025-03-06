
import { useMemo } from 'react';

export const useConversionEstimation = (extractedText: string) => {
  // Memorizar la función de cálculo para evitar recreaciones innecesarias
  return useMemo(() => {
    // Devolver un objeto con la función que puede ser llamada cuando sea necesario
    return {
      calculateEstimatedSeconds: () => {
        if (!extractedText) return 0;

        const wordsCount = extractedText.split(/\s+/).length;
        const averageWordsPerMinute = 150;
        const baseProcessingTime = 5; // Tiempo mínimo en segundos
        
        const estimation = Math.ceil((wordsCount / averageWordsPerMinute) * 60 + baseProcessingTime);
        return estimation;
      }
    };
  }, [extractedText]);
};
