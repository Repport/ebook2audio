
import { useState, useRef } from 'react';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const useProgressManagement = (initialProgress: number = 0) => {
  const [progress, setProgress] = useState<number>(Math.max(1, initialProgress));
  const [processedChunks, setProcessedChunks] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  
  // References for persistent data
  const progressHistoryRef = useRef<{time: number, value: number}[]>([]);
  const processedCharsRef = useRef<number>(0);
  const totalCharsRef = useRef<number>(0);
  const autoIncrementRef = useRef<boolean>(false);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Process progress updates
  const updateProgress = (
    data: ChunkProgressData,
    elapsedTime: number
  ) => {
    if (!data) return;
    
    // Mark time of this update
    const now = Date.now();
    lastUpdateTimeRef.current = now;
    
    // If we receive completed signal, go to 100%
    if (data.isCompleted) {
      setProgress(100);
      return;
    }
    
    // Update chunk counters if available
    if (typeof data.processedChunks === 'number' && typeof data.totalChunks === 'number') {
      setProcessedChunks(data.processedChunks);
      setTotalChunks(data.totalChunks);
    }
    
    // Update character counters if available
    if (typeof data.processedCharacters === 'number') {
      processedCharsRef.current = data.processedCharacters;
    }
    
    if (typeof data.totalCharacters === 'number' && data.totalCharacters > 0) {
      totalCharsRef.current = data.totalCharacters;
    }
    
    // Update speed if we have character data
    if (processedCharsRef.current > 0 && elapsedTime > 0) {
      const charsPerSecond = processedCharsRef.current / Math.max(1, elapsedTime);
      setSpeed(charsPerSecond);
    }
    
    // Determine new progress value
    let newProgress: number | undefined;
    
    // 1. Use direct progress if available
    if (typeof data.progress === 'number' && !isNaN(data.progress)) {
      newProgress = data.progress;
    }
    // 2. Calculate based on characters if available
    else if (processedCharsRef.current > 0 && totalCharsRef.current > 0) {
      newProgress = Math.round((processedCharsRef.current / totalCharsRef.current) * 100);
    }
    // 3. Calculate based on chunks if available
    else if (data.processedChunks && data.totalChunks) {
      newProgress = Math.round((data.processedChunks / data.totalChunks) * 100);
    }
    
    // If we have a valid value, update progress
    if (typeof newProgress === 'number' && !isNaN(newProgress)) {
      // Limit between 1% and 100%
      newProgress = Math.max(1, Math.min(100, newProgress));
      
      // If we were in auto-increment, we need a significant jump
      // to accept an external value and exit auto mode
      const significantChange = autoIncrementRef.current 
        ? newProgress > progress + 5  // Requires a jump of at least 5%
        : newProgress > progress;     // Any increment is valid
      
      if (significantChange) {
        // Exit auto-increment mode if we were in it
        if (autoIncrementRef.current) {
          console.log(`Exiting auto-increment mode with real progress: ${newProgress}%`);
          autoIncrementRef.current = false;
        }
        
        // Update progress and record
        setProgress(newProgress);
        progressHistoryRef.current.push({time: now, value: newProgress});
      }
    }
  };

  // Handle auto-increment logic
  const handleAutoIncrement = () => {
    const now = Date.now();
    const secondsSinceLastUpdate = (now - lastUpdateTimeRef.current) / 1000;
    
    // If more than 10 seconds without updates and we're below 95%
    if (secondsSinceLastUpdate > 10 && progress < 95) {
      // Increment based on elapsed time and current progress
      // Slower as current progress gets higher
      const increment = Math.max(0.5, (100 - progress) / 100);
      const newProgress = Math.min(95, progress + increment);
      
      // Record that we're in auto-increment mode
      if (!autoIncrementRef.current) {
        console.log('Activating auto-increment mode due to inactivity');
        autoIncrementRef.current = true;
      }
      
      console.log(`Auto-incrementing progress: ${progress}% → ${newProgress}%`);
      setProgress(newProgress);
      
      // Only record for analysis
      progressHistoryRef.current.push({time: now, value: newProgress});
      
      return newProgress;
    }
    
    return progress;
  };

  return {
    progress,
    setProgress,
    processedChunks,
    totalChunks,
    speed,
    updateProgress,
    handleAutoIncrement,
    lastUpdateTimeRef,
    progressHistoryRef,
    processedCharsRef,
    totalCharsRef,
    autoIncrementRef
  };
};
