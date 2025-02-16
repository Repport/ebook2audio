
import { useState, useEffect } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';

export const calculateTimeRemaining = (
  progress: number,
  processedChunks: number,
  totalChunks: number,
  elapsedTime: number
): string | null => {
  if (progress >= 100 || processedChunks === 0) {
    return null;
  }

  if (processedChunks > 0 && totalChunks > 0) {
    const remainingChunks = totalChunks - processedChunks;
    const avgTimePerChunk = elapsedTime / processedChunks;
    const estimatedRemainingSeconds = Math.ceil(remainingChunks * avgTimePerChunk);
    const safeEstimatedTime = Math.max(estimatedRemainingSeconds, 5);

    console.log('⏱️ Time estimation updated:', {
      remainingChunks,
      avgTimePerChunk: `${avgTimePerChunk.toFixed(1)}s`,
      estimatedRemainingSeconds,
      elapsedTime,
      processedChunks,
      totalChunks,
      progress: `${progress.toFixed(1)}%`
    });

    return formatTimeRemaining(safeEstimatedTime);
  }

  return 'Calculating...';
};

export const useTimeEstimation = (
  progress: number,
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  processedChunks: number,
  elapsedTime: number,
  totalChunks: number
): string | null => {
  const [timeRemaining, setTimeRemaining] = useState<string | null>('Calculating...');

  useEffect(() => {
    const estimated = calculateTimeRemaining(progress, processedChunks, totalChunks, elapsedTime);
    setTimeRemaining(estimated);
  }, [progress, status, processedChunks, elapsedTime, totalChunks]);

  return timeRemaining;
};
