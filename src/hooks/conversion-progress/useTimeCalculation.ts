import { useRef, useState, useEffect } from 'react';

export const useTimeCalculation = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialElapsedTime: number = 0,
  estimatedSeconds: number = 120,
  textLength?: number
) => {
  const [elapsedTime, setElapsedTime] = useState<number>(initialElapsedTime || 0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(estimatedSeconds || 120);
  
  // Referencias para persistent data
  const startTimeRef = useRef<number>(initialElapsedTime ? (Date.now() - initialElapsedTime * 1000) : Date.now());
  const elapsedTimeRef = useRef<number>(initialElapsedTime || 0);
  const timeRemainingHistoryRef = useRef<number[]>([]);
  const hasInitializedRef = useRef<boolean>(initialElapsedTime ? true : false);
  const lastProgressRef = useRef<number>(0);
  const progressSpeedRef = useRef<number[]>([]);

  // Initialize timer when status changes
  useEffect(() => {
    if (status === 'converting' || status === 'processing') {
      // Only initialize start time if first time or changing from completed/error
      if (!hasInitializedRef.current || ['completed', 'error', 'idle'].includes(status as string)) {
        console.log('Initializing start time for conversion');
        startTimeRef.current = Date.now() - (elapsedTimeRef.current * 1000); // Maintain elapsed time
        hasInitializedRef.current = true;
        
        // Also update time remaining with fresh estimate
        setTimeRemaining(estimatedSeconds || (textLength ? Math.ceil(textLength / 1000) : 120));
      }
      
      // Reset history if coming from completed/error
      if (['completed', 'error', 'idle'].includes(status as string)) {
        timeRemainingHistoryRef.current = [];
        progressSpeedRef.current = [];
        lastProgressRef.current = 0;
      }
    } 
    else if (status === 'completed') {
      setTimeRemaining(0);
    }
  }, [status, initialElapsedTime, estimatedSeconds, textLength]);

  // Calculate time remaining based on progress and elapsed time
  const calculateTimeRemaining = (progress: number): number => {
    // Track progress speed for better estimation
    const now = Date.now();
    const currentElapsed = elapsedTime;

    // If we just started, use the initial estimate
    if (elapsedTime < 3 || progress <= 1) {
      return estimatedSeconds || (textLength ? Math.ceil(textLength / 1000) : 120);
    }

    // Calculate progress speed if we have enough data
    if (progress > lastProgressRef.current && progress > 1) {
      const progressDelta = progress - lastProgressRef.current;
      const timeDelta = elapsedTime - elapsedTimeRef.current;
      
      if (timeDelta > 0 && progressDelta > 0) {
        const speed = progressDelta / timeDelta; // % per second
        progressSpeedRef.current.push(speed);
        
        // Keep only the last 5 values
        if (progressSpeedRef.current.length > 5) {
          progressSpeedRef.current.shift();
        }
        
        lastProgressRef.current = progress;
        elapsedTimeRef.current = elapsedTime;
      }
    }
    
    // Calculate based on progress speed history if available
    if (progressSpeedRef.current.length > 0) {
      // Use average of last speeds for stability
      const avgSpeed = progressSpeedRef.current.reduce((a, b) => a + b, 0) / progressSpeedRef.current.length;
      
      if (avgSpeed > 0) {
        const remainingProgress = 100 - progress;
        const remainingTime = remainingProgress / avgSpeed;
        
        // Apply some corrections based on text length if available
        const correction = textLength ? Math.min(1.5, textLength / 100000) : 1;
        return Math.max(1, Math.ceil(remainingTime * correction));
      }
    }
    
    // Standard calculation based on progress and elapsed time as fallback
    const percentComplete = Math.max(0.01, progress / 100);
    const estimatedTotalTime = elapsedTime / percentComplete;
    const remaining = Math.max(1, estimatedTotalTime - elapsedTime);
    
    // Reasonable maximum value based on text length
    const maxValue = textLength 
      ? Math.min(1800, Math.max(30, textLength / 100)) 
      : 600;
    
    return Math.min(remaining, maxValue);
  };

  // Smooth time remaining to avoid fluctuations
  const smoothTimeRemaining = (newTime: number): number => {
    // Add new value to history
    timeRemainingHistoryRef.current.push(newTime);
    
    // Keep only the last 5 values
    if (timeRemainingHistoryRef.current.length > 5) {
      timeRemainingHistoryRef.current.shift();
    }
    
    // If we have enough values, use a weighted average
    // giving more weight to more recent values
    if (timeRemainingHistoryRef.current.length >= 3) {
      const weights = [0.1, 0.15, 0.2, 0.25, 0.3]; // Higher weight to more recent values
      const usedWeights = weights.slice(-timeRemainingHistoryRef.current.length);
      
      let weightedSum = 0;
      let totalWeight = 0;
      
      for (let i = 0; i < timeRemainingHistoryRef.current.length; i++) {
        weightedSum += timeRemainingHistoryRef.current[i] * usedWeights[i];
        totalWeight += usedWeights[i];
      }
      
      return Math.round(weightedSum / totalWeight);
    }
    
    // If we don't have enough values, return most recent value
    return newTime;
  };

  const updateTimeRemaining = (progress: number) => {
    const rawTimeRemaining = calculateTimeRemaining(progress);
    const smoothedTime = smoothTimeRemaining(rawTimeRemaining);
    setTimeRemaining(smoothedTime);
  };

  // Reset function to clear all state
  const resetTimeCalculation = () => {
    timeRemainingHistoryRef.current = [];
    progressSpeedRef.current = [];
    lastProgressRef.current = 0;
    elapsedTimeRef.current = 0;
    setElapsedTime(0);
    setTimeRemaining(estimatedSeconds);
    startTimeRef.current = Date.now();
  };

  return {
    elapsedTime,
    setElapsedTime,
    timeRemaining,
    updateTimeRemaining,
    resetTimeCalculation,
    startTimeRef,
    elapsedTimeRef
  };
};
