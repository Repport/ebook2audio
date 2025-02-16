
import { useState, useEffect } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';

export const calculateTimeRemaining = (
  progress: number,
  processedChunks: number,
  totalChunks: number,
  elapsedTime: number
): string | null => {
  if (progress >= 100) return null;
  
  // Si no hay chunks procesados, usar el progreso general
  if (processedChunks === 0) {
    if (progress > 0) {
      // Estimar basado en el progreso actual
      const estimatedTotalTime = (elapsedTime * 100) / Math.max(progress, 1);
      return formatTimeRemaining(Math.ceil(estimatedTotalTime - elapsedTime));
    }
    return 'Estimating...';
  }

  const remainingChunks = Math.max(totalChunks - processedChunks, 1);
  const avgTimePerChunk = elapsedTime / Math.max(processedChunks, 1);
  const estimatedRemainingSeconds = Math.ceil(remainingChunks * avgTimePerChunk);

  return formatTimeRemaining(estimatedRemainingSeconds);
};

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
      // Usar una estimación inicial basada en el progreso
      if (progress > 0) {
        const estimatedTotalTime = (elapsedTime * 100) / Math.max(progress, 1);
        setTimeRemaining(Math.ceil(estimatedTotalTime - elapsedTime));
      } else {
        setTimeRemaining(null);
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
