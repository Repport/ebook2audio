
import { useCallback } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';

export const useTimeEstimation = (
  progress: number,
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  processedChunks: number,
  elapsedTime: number,
  effectiveTotalChunks: number
) => {
  return useCallback(() => {
    if (progress >= 100 || status === 'completed') {
      return null;
    }

    if (processedChunks === 0 || effectiveTotalChunks === 0 || elapsedTime === 0) {
      return 'Calculating...';
    }

    const avgTimePerChunk = elapsedTime / processedChunks;
    const estimatedRemainingSeconds = Math.ceil((effectiveTotalChunks - processedChunks) * avgTimePerChunk);
    const safeEstimatedTime = Math.max(estimatedRemainingSeconds, 5);

    console.log('⏱️ Time estimation:', {
      remainingChunks: effectiveTotalChunks - processedChunks,
      avgTimePerChunk: `${avgTimePerChunk.toFixed(1)}s`,
      estimatedRemainingSeconds,
      elapsedTime,
      processedChunks,
      effectiveTotalChunks,
      currentProgress: `${progress.toFixed(1)}%`
    });

    return formatTimeRemaining(safeEstimatedTime);
  }, [progress, status, processedChunks, elapsedTime, effectiveTotalChunks]);
};
