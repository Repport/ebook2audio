
import { useState, useEffect } from 'react';

export const useTimeEstimation = (
  progress: number,
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  processedCharacters: number,
  elapsedTime: number,
  totalCharacters: number
): number | null => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (progress >= 100 || status === 'completed') {
      setTimeRemaining(null);
      return;
    }

    if (processedCharacters === 0) {
      // Usar progreso general para estimación inicial
      if (progress > 0) {
        const estimatedTotalTime = (elapsedTime * 100) / Math.max(progress, 1);
        const estimated = Math.ceil(estimatedTotalTime - elapsedTime);
        console.log('⏱️ Initial time estimation based on progress:', {
          progress,
          elapsedTime,
          estimated
        });
        setTimeRemaining(estimated);
      } else {
        console.log('⏱️ Using default initial estimation');
        setTimeRemaining(60); // Valor inicial de fallback
      }
      return;
    }

    if (elapsedTime > 0) {
      const speed = processedCharacters / elapsedTime; // Caracteres por segundo
      const remainingCharacters = totalCharacters - processedCharacters;
      const estimatedSeconds = Math.ceil(remainingCharacters / speed);
      
      console.log('⏱️ Time estimation update:', {
        processedCharacters,
        totalCharacters,
        elapsedTime,
        speed: `${speed.toFixed(1)} chars/sec`,
        estimatedSeconds
      });
      
      setTimeRemaining(estimatedSeconds);
    }
  }, [progress, status, processedCharacters, elapsedTime, totalCharacters]);

  return timeRemaining;
};
