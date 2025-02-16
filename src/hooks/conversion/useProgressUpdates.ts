
import { useCallback } from 'react';

interface ProgressUpdateData {
  progress: number;
  processed_characters?: number | null;
  total_characters?: number | null;
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
    
    const { progress: newProgress, processed_characters, total_characters } = data;
    lastUpdateRef.current = currentTime;
    
    if (processed_characters && total_characters) {
      const calculatedProgress = Math.min((processed_characters / total_characters) * 100, 99);
      console.log(`📊 Progress from characters: ${processed_characters}/${total_characters} (${calculatedProgress.toFixed(1)}%)`);
      setProgress(calculatedProgress);
    } else if (typeof newProgress === 'number' && newProgress >= 0) {
      setProgress((prev) => {
        const nextProgress = Math.max(prev, Math.min(newProgress, 99));
        console.log(`📈 Updated progress: ${prev}% -> ${nextProgress}%`);
        return nextProgress;
      });
    }

    if (total_characters) {
      const estimatedChunks = Math.ceil(total_characters / 4800); // Tamaño aproximado de chunk
      setTotalChunks(estimatedChunks);
      if (processed_characters) {
        const processedChunks = Math.ceil(processed_characters / 4800);
        setProcessedChunks(processedChunks);
      }
    }
  }, [setProgress, setProcessedChunks, setTotalChunks, lastUpdateRef, calculatedTotalChunks]);
};
