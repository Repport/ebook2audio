
import { useRef, useState, useEffect } from 'react';

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialProgress: number,
  estimatedSeconds: number,
  conversionId?: string | null,
  textLength?: number
) => {
  const [progress, setProgress] = useState<number>(initialProgress);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [processedChunks, setProcessedChunks] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  
  const startTimeRef = useRef<number>(Date.now());
  const lastUpdateRef = useRef<number>(Date.now());
  const processedCharactersRef = useRef<number>(0);

  // Reset timers when conversion starts
  useEffect(() => {
    if (status === 'converting' || status === 'processing') {
      startTimeRef.current = Date.now();
      lastUpdateRef.current = Date.now();
      processedCharactersRef.current = 0;
      setProgress(0);
      setElapsedTime(0);
      setProcessedChunks(0);
    }
  }, [status]);

  // Update elapsed time
  useEffect(() => {
    let intervalId: number;
    
    if (status === 'converting' || status === 'processing') {
      intervalId = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
        
        if (processedCharactersRef.current > 0) {
          const speed = processedCharactersRef.current / elapsed;
          setSpeed(speed);
        }
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [status]);

  const updateProgress = (data: any) => {
    if (!data) return;

    const { processedChunks, totalChunks, processedCharacters, totalCharacters } = data;
    
    if (typeof processedChunks === 'number' && typeof totalChunks === 'number') {
      setProcessedChunks(processedChunks);
      setTotalChunks(totalChunks);
    }

    if (typeof processedCharacters === 'number' && typeof totalCharacters === 'number') {
      processedCharactersRef.current = processedCharacters;
      const newProgress = Math.round((processedCharacters / totalCharacters) * 100);
      setProgress(newProgress);
    }
  };

  return {
    progress,
    updateProgress,
    elapsedTime,
    timeRemaining: estimatedSeconds - elapsedTime,
    hasStarted: processedCharactersRef.current > 0,
    processedChunks,
    totalChunks,
    speed
  };
};
