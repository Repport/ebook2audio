
import { useState, useEffect } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import { supabase } from '@/integrations/supabase/client';

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  progress: number,
  estimatedSeconds: number,
  conversionId?: string | null
) => {
  const [smoothProgress, setSmoothProgress] = useState(progress);
  const [showEstimate, setShowEstimate] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [adjustedEstimate, setAdjustedEstimate] = useState(estimatedSeconds);

  // Real-time updates subscription
  useEffect(() => {
    let channel;
    
    if (conversionId) {
      channel = supabase
        .channel(`conversion-${conversionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'text_conversions',
            filter: `id=eq.${conversionId}`,
          },
          (payload) => {
            const { progress: newProgress } = payload.new;
            if (typeof newProgress === 'number') {
              setSmoothProgress(newProgress);
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversionId]);

  // Smooth progress transition
  useEffect(() => {
    let interval;
    
    if (progress > smoothProgress) {
      interval = setInterval(() => {
        setSmoothProgress(prev => {
          const next = Math.min(prev + 1, progress);
          if (next === progress) clearInterval(interval);
          return next;
        });
      }, 50);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [progress, smoothProgress]);

  // Track elapsed time and adjust estimation
  useEffect(() => {
    let intervalId;
    let hideEstimateTimeout;
    
    if (status === 'converting') {
      intervalId = window.setInterval(() => {
        setElapsedSeconds(prev => {
          const newElapsed = prev + 1;
          
          // Adjust estimation based on actual progress rate
          if (smoothProgress > 0 && newElapsed > 5) {
            const progressRate = smoothProgress / newElapsed;
            if (progressRate > 0) {
              const remainingProgress = 100 - smoothProgress;
              const newEstimate = Math.ceil(newElapsed + (remainingProgress / progressRate));
              setAdjustedEstimate(newEstimate);
            }
          }
          
          return newElapsed;
        });
      }, 1000);

      // Hide estimate if conversion seems stuck
      hideEstimateTimeout = setTimeout(() => {
        if (smoothProgress === 0 && elapsedSeconds > 30) {
          setShowEstimate(false);
        }
      }, 30000);
    } else {
      setElapsedSeconds(0);
      setShowEstimate(true);
      setAdjustedEstimate(estimatedSeconds);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (hideEstimateTimeout) {
        clearTimeout(hideEstimateTimeout);
      }
    };
  }, [status, smoothProgress, elapsedSeconds, estimatedSeconds]);

  const getEstimatedTimeRemaining = () => {
    if (status !== 'converting' || smoothProgress >= 100) {
      return null;
    }

    if (smoothProgress === 0) {
      return formatTimeRemaining(adjustedEstimate);
    }

    // Calculate remaining time based on actual progress rate
    const progressRate = smoothProgress / Math.max(elapsedSeconds, 1);
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
