
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
    const timeSinceLastUpdate = (currentTime - lastUpdateRef.current) / 1000;
    
    console.log('⚡ Progress update received:', {
      ...data,
      timeSinceLastUpdate: `${timeSinceLastUpdate.toFixed(1)}s`,
      calculatedTotalChunks
    });
    
    const { progress: newProgress, processed_chunks, total_chunks } = data;
    lastUpdateRef.current = currentTime;

    if (typeof total_chunks === 'number' && !isNaN(total_chunks) && total_chunks > 0) {
      setTotalChunks(total_chunks);
    } else if (calculatedTotalChunks > 0) {
      setTotalChunks(calculatedTotalChunks);
    }

    if (typeof processed_chunks === 'number' && !isNaN(processed_chunks)) {
      setProcessedChunks(prev => {
        const newValue = Math.max(prev, processed_chunks);
        console.log(`📈 Processed chunks updated: ${prev} -> ${newValue}`);
        return newValue;
      });
    }

    if (typeof newProgress === 'number' && !isNaN(newProgress) && newProgress >= 0) {
      setProgress(prev => {
        const newValue = Math.max(prev, newProgress);
        console.log(`🎯 Progress updated: ${prev.toFixed(1)}% -> ${newValue.toFixed(1)}%`);
        return newValue;
      });
    }
  }, [setProgress, setProcessedChunks, setTotalChunks, lastUpdateRef, calculatedTotalChunks]);
};
