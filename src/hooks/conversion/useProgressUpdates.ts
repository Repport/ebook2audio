
import { useCallback } from 'react';

interface ProgressUpdateData {
  progress: number;
  processed_chunks?: number | null;
  total_chunks?: number | null;
}

export const useProgressUpdates = (
  setProgress: (value: number | ((prev: number) => number)) => void,
  setProcessedChunks: (value: number | ((prev: number) => number)) => void,
  setTotalChunks: (value: number) => void,
  lastUpdateRef: React.MutableRefObject<number>,
  calculatedTotalChunks: number
) => {
  return useCallback((data: ProgressUpdateData) => {
    const currentTime = Date.now();
    if (currentTime - lastUpdateRef.current < 1000) return; // Evitar updates demasiado frecuentes
    lastUpdateRef.current = currentTime;

    if (typeof data.total_chunks === 'number' && data.total_chunks > 0) {
      setTotalChunks(data.total_chunks);
    }

    if (typeof data.processed_chunks === 'number') {
      setProcessedChunks((prev) => Math.max(prev, data.processed_chunks));
    }

    if (typeof data.progress === 'number') {
      setProgress((prev) => Math.max(prev, data.progress));
    }
  }, [setProgress, setProcessedChunks, setTotalChunks, lastUpdateRef]);
};
