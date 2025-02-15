
import { useState, useEffect } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';

export const useTimeEstimation = (
  progress: number,
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  processedChunks: number,
  elapsedTime: number,
  totalChunks: number
) => {
  const [timeRemaining, setTimeRemaining] = useState<string | null>('Calculating...');
  const [chunkTimes, setChunkTimes] = useState<number[]>([]);

  useEffect(() => {
    if (progress >= 100 || status === 'completed') {
      setTimeRemaining(null);
      return;
    }

    if (processedChunks === 0 || totalChunks === 0 || elapsedTime === 0) {
      setTimeRemaining('Calculating...');
      return;
    }

    const remainingChunks = totalChunks - processedChunks;

    // Guardar los últimos tiempos por chunk
    setChunkTimes(prev => {
      const newChunkTimes = [...prev, elapsedTime / processedChunks];
      return newChunkTimes.length > 5 ? newChunkTimes.slice(1) : newChunkTimes;
    });

    // Promedio móvil de los últimos 5 tiempos por chunk
    const avgTimePerChunk = chunkTimes.length > 0
      ? chunkTimes.reduce((acc, val) => acc + val, 0) / chunkTimes.length
      : elapsedTime / processedChunks;

    const estimatedRemainingSeconds = Math.ceil(remainingChunks * avgTimePerChunk);
    const safeEstimatedTime = Math.max(estimatedRemainingSeconds, 5); // Evitar valores negativos

    console.log('⏱️ Time estimation updated:', {
      remainingChunks,
      avgTimePerChunk: `${avgTimePerChunk.toFixed(1)}s`,
      estimatedRemainingSeconds,
      elapsedTime,
      processedChunks,
      totalChunks,
      currentProgress: `${progress.toFixed(1)}%`,
      chunkTimesHistory: chunkTimes.map(t => t.toFixed(1) + 's')
    });

    setTimeRemaining(formatTimeRemaining(safeEstimatedTime));
  }, [progress, status, processedChunks, elapsedTime, totalChunks, chunkTimes]);

  return timeRemaining;
};
