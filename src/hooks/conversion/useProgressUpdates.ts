
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
      timeSinceLastUpdate,
      calculatedTotalChunks 
    });
    
    const { progress: newProgress, processed_chunks, total_chunks } = data;
    lastUpdateRef.current = currentTime;

    if (typeof total_chunks === 'number' && total_chunks > 0) {
      console.log(`📊 Setting total chunks: ${total_chunks}`);
      setTotalChunks(total_chunks);
    } else if (calculatedTotalChunks > 0) {
      console.log(`📊 Using calculated total chunks: ${calculatedTotalChunks}`);
      setTotalChunks(calculatedTotalChunks);
    }

    if (typeof processed_chunks === 'number') {
      setProcessedChunks((prev) => {
        const newProcessed = Math.max(prev, processed_chunks);
        console.log(`📈 Updated processed chunks: ${prev} -> ${newProcessed}`);
        return newProcessed;
      });
    }

    if (typeof newProgress === 'number' && newProgress >= 0) {
      setProgress((prev) => {
        const nextProgress = Math.max(prev, newProgress);
        console.log(`📈 Updated progress: ${prev}% -> ${nextProgress}%`);
        return nextProgress;
      });
    }
  }, [setProgress, setProcessedChunks, setTotalChunks, lastUpdateRef, calculatedTotalChunks]);
};
