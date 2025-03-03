import { useRef, useState, useEffect } from 'react';

export const useTimeCalculation = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialElapsedTime: number = 0,
  estimatedSeconds: number = 120,
  textLength?: number
) => {
  const [elapsedTime, setElapsedTime] = useState<number>(initialElapsedTime || 0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(estimatedSeconds || 120);
  
  // References for persistent data
  const startTimeRef = useRef<number>(initialElapsedTime ? (Date.now() - initialElapsedTime * 1000) : Date.now());
  const elapsedTimeRef = useRef<number>(initialElapsedTime || 0);
  const timeRemainingHistoryRef = useRef<number[]>([]);
  const hasInitializedRef = useRef<boolean>(initialElapsedTime ? true : false);

  // Initialize timer when status changes
  useEffect(() => {
    if (status === 'converting' || status === 'processing') {
      // Only initialize start time if first time or changing from completed/error
      if (!hasInitializedRef.current || ['completed', 'error'].includes(status as string)) {
        console.log('Initializing start time for conversion');
        startTimeRef.current = Date.now() - (elapsedTimeRef.current * 1000); // Maintain elapsed time
        hasInitializedRef.current = true;
      }
      
      // Reset history if coming from completed/error
      if (['completed', 'error'].includes(status as string)) {
        timeRemainingHistoryRef.current = [];
      }
    } 
    else if (status === 'completed') {
      setTimeRemaining(0);
    }
  }, [status, initialElapsedTime]);

  // Calculate time remaining based on progress and elapsed time
  const calculateTimeRemaining = (progress: number): number => {
    // Early stage of conversion
    if (elapsedTime < 3 || progress <= 1) {
      return estimatedSeconds || 120; // Reasonable initial value
    }
    
    // Standard calculation based on progress and elapsed time
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

  return {
    elapsedTime,
    setElapsedTime,
    timeRemaining,
    updateTimeRemaining,
    startTimeRef,
    elapsedTimeRef
  };
};
