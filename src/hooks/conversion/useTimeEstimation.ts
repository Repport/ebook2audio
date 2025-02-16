
import { useState, useEffect } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';

export const calculateTimeRemaining = (
  progress: number,
  processedChunks: number,
  totalChunks: number,
  elapsedTime: number
): string | null => {
  if (progress >= 100) return null;
  if (processedChunks === 0) return 'Estimating...';

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
    if (progress >= 100) {
      setTimeRemaining(null);
      return;
    }

    if (processedChunks === 0) {
      setTimeRemaining(null);
      return;
    }

    const remainingChunks = Math.max(totalChunks - processedChunks, 1);
    const avgTimePerChunk = elapsedTime / Math.max(processedChunks, 1);
    const estimatedSeconds = Math.ceil(remainingChunks * avgTimePerChunk);
    setTimeRemaining(estimatedSeconds);
  }, [progress, status, processedChunks, elapsedTime, totalChunks]);

  return timeRemaining;
};
