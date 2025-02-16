
import { useEffect } from 'react';
import { calculateSimulatedProgress } from '@/utils/progressSimulation';

export const useProgressSimulation = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  progress: number,
  totalCharacters: number,
  processedChunks: number,
  setProgress: (value: number | ((prev: number) => number)) => void,
  setElapsedTime: (value: number) => void,
  startTimeRef: React.MutableRefObject<number>,
  lastUpdateRef: React.MutableRefObject<number>,
  processedCharactersRef: React.MutableRefObject<number>
) => {
  useEffect(() => {
    let interval: number | undefined;

    if ((status === 'converting' || status === 'processing') && progress < 100) {
      interval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
        
        const timeSinceLastUpdate = (Date.now() - lastUpdateRef.current) / 1000;
        console.log(`⏳ Time since last update: ${timeSinceLastUpdate.toFixed(1)}s`);
        
        if (timeSinceLastUpdate > 5 && progress < 90) {
          const simulatedProgress = calculateSimulatedProgress(
            elapsed,
            Math.ceil(totalCharacters / 4800),
            processedChunks,
            progress
          );
          
          setProgress(prev => {
            const newProgress = Math.max(prev, simulatedProgress);
            if (newProgress !== prev) {
              console.log('🤖 Progress update:', {
                previous: prev.toFixed(1),
                new: newProgress.toFixed(1),
                elapsed,
                processed: processedCharactersRef.current,
                total: totalCharacters
              });
            }
            return newProgress;
          });

          processedCharactersRef.current = Math.floor((simulatedProgress / 100) * totalCharacters);
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, progress, totalCharacters, processedChunks, setProgress, setElapsedTime, startTimeRef, lastUpdateRef, processedCharactersRef]);
};
