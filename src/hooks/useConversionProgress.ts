
import { useState, useEffect } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  progress: number,
  estimatedSeconds: number
) => {
  const [smoothProgress, setSmoothProgress] = useState(progress);
  const [showEstimate, setShowEstimate] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [adjustedEstimate, setAdjustedEstimate] = useState(estimatedSeconds);

  // Smooth progress transition
  useEffect(() => {
    if (progress > smoothProgress) {
      const interval = setInterval(() => {
        setSmoothProgress(prev => {
          const next = Math.min(prev + 1, progress);
          if (next === progress) clearInterval(interval);
          return next;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [progress, smoothProgress]);

  // Track elapsed time and dynamically adjust estimation
  useEffect(() => {
    let intervalId: number;
    
    if (status === 'converting') {
      intervalId = window.setInterval(() => {
        setElapsedSeconds(prev => {
          const newElapsed = prev + 1;
          
          // Adjust estimation based on actual progress rate
          if (progress > 0 && newElapsed > 5) { // Wait 5 seconds before adjusting
            const progressRate = progress / newElapsed; // Progress per second
            if (progressRate > 0) {
              const remainingProgress = 100 - progress;
              const newEstimate = Math.ceil(newElapsed + (remainingProgress / progressRate));
              setAdjustedEstimate(newEstimate);
            }
          }
          
          return newElapsed;
        });
      }, 1000);

      // Hide estimate if conversion seems stuck
      const hideEstimateTimeout = setTimeout(() => {
        if (progress === 0 && elapsedSeconds > 30) {
          setShowEstimate(false);
        }
      }, 30000);

      return () => {
        clearInterval(intervalId);
        clearTimeout(hideEstimateTimeout);
      };
    } else {
      setElapsedSeconds(0);
      setShowEstimate(true);
      setAdjustedEstimate(estimatedSeconds);
    }
  }, [status, progress, elapsedSeconds, estimatedSeconds]);

  const getEstimatedTimeRemaining = () => {
    if (status !== 'converting' || smoothProgress >= 100) {
      return null;
    }

    if (progress === 0) {
      return formatTimeRemaining(adjustedEstimate);
    }

    // Calculate remaining time based on actual progress rate
    const progressRate = smoothProgress / Math.max(elapsedSeconds, 1); // Progress per second
    if (progressRate <= 0 || !isFinite(progressRate)) {
      return formatTimeRemaining(adjustedEstimate);
    }
    
    const remainingProgress = 100 - smoothProgress;
    const estimatedRemainingSeconds = Math.ceil(remainingProgress / progressRate);
    
    return formatTimeRemaining(estimatedRemainingSeconds);
  };

  return {
    smoothProgress,
    showEstimate,
    timeRemaining: showEstimate ? getEstimatedTimeRemaining() : null,
    elapsedSeconds
  };
};
