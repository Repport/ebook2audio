
import { useState, useEffect } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';

export const useTimeEstimation = (
  progress: number,
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  processedChunks: number,
  elapsedTime: number,
  totalChunks: number
): number | null => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (progress >= 100 || status === 'completed') {
      setTimeRemaining(null);
      return;
    }

    if (processedChunks === 0) {
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

    const remainingChunks = Math.max(totalChunks - processedChunks, 1);
    const avgTimePerChunk = elapsedTime / Math.max(processedChunks, 1);
    const estimatedSeconds = Math.ceil(remainingChunks * avgTimePerChunk);
    
    console.log('⏱️ Time estimation update:', {
      processedChunks,
      totalChunks,
      elapsedTime,
      avgTimePerChunk,
      estimatedSeconds
    });
    
    setTimeRemaining(estimatedSeconds);
  }, [progress, status, processedChunks, elapsedTime, totalChunks]);

  return timeRemaining;
};
