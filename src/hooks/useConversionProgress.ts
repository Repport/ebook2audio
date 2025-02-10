
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

  // Track elapsed time and update estimate visibility
  useEffect(() => {
    let intervalId: number;
    
    if (status === 'converting') {
      intervalId = window.setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      // Hide estimate after 30 seconds if conversion seems stuck
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
    }
  }, [status, progress, elapsedSeconds]);

  const getEstimatedTimeRemaining = () => {
    if (status !== 'converting' || smoothProgress >= 100 || !estimatedSeconds) {
      return null;
    }

    // Calculate remaining time based on progress and elapsed time
    const progressRate = smoothProgress / Math.max(elapsedSeconds, 1); // Progress per second
    if (progressRate <= 0 || !isFinite(progressRate)) {
      return formatTimeRemaining(estimatedSeconds);
    }
    
    const remainingProgress = 100 - smoothProgress;
    const estimatedRemainingSeconds = Math.ceil(remainingProgress / progressRate);
    
    return formatTimeRemaining(estimatedRemainingSeconds);
  };

  return {
    smoothProgress,
    showEstimate,
    timeRemaining: showEstimate ? getEstimatedTimeRemaining() : null
  };
};
