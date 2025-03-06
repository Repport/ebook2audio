
import { useMemo } from 'react';

export const useConversionEstimation = (extractedText: string) => {
  // Memorizar la función de cálculo para evitar recreaciones innecesarias
  return useMemo(() => {
    // Devolver un objeto con la función que puede ser llamada cuando sea necesario
    return {
      calculateEstimatedSeconds: () => {
        if (!extractedText) return 0;

        const wordsCount = extractedText.split(/\s+/).length;
        const charactersCount = extractedText.length;
        
        // Mejores estimaciones basadas en datos reales
        // 150 palabras por minuto (2.5 palabras por segundo)
        const wordBasedEstimate = Math.ceil(wordsCount / 2.5);
        
        // Aproximadamente 15 caracteres por segundo para la síntesis de voz
        const charBasedEstimate = Math.ceil(charactersCount / 15);
        
        // Tiempo base de procesamiento más el mayor de las estimaciones
        const baseProcessingTime = 10; // Tiempo mínimo en segundos
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
