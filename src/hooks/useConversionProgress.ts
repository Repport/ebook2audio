
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
  const [showEstimate, setShowEstimate] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [adjustedEstimate, setAdjustedEstimate] = useState(estimatedSeconds);

  // Update smooth progress when initial progress changes
  useEffect(() => {
    if (progress > smoothProgress) {
      setSmoothProgress(progress);
    }
  }, [progress, smoothProgress]);

  // Real-time updates subscription
  useEffect(() => {
    let channel;
    
    if (conversionId && (status === 'converting' || status === 'processing')) {
      console.log('Setting up real-time updates for conversion:', conversionId);
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
          (payload: any) => {
            console.log('Received progress update:', payload);
            const newProgress = payload.new.progress;
            if (typeof newProgress === 'number' && newProgress > smoothProgress) {
              setSmoothProgress(newProgress);
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });
    }

    return () => {
      if (channel) {
        console.log('Cleaning up subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [conversionId, status, smoothProgress]);

  // Track elapsed time and adjust estimation
  useEffect(() => {
    let intervalId: number;
    
    if (status === 'converting' || status === 'processing') {
      intervalId = window.setInterval(() => {
        setElapsedSeconds(prev => {
          const newElapsed = prev + 1;
          
          // Only show and adjust estimation after we have some real progress
          if (smoothProgress > 5 && newElapsed > 10) {
            const progressRate = smoothProgress / newElapsed;
            if (progressRate > 0) {
              const remainingProgress = 100 - smoothProgress;
              const newEstimate = Math.ceil(newElapsed + (remainingProgress / progressRate));
              setAdjustedEstimate(newEstimate);
              setShowEstimate(true);
            }
          }
          
          return newElapsed;
        });
      }, 1000);
    } else {
      setElapsedSeconds(0);
      setShowEstimate(false);
      setAdjustedEstimate(estimatedSeconds);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status, smoothProgress, estimatedSeconds]);

  const getEstimatedTimeRemaining = () => {
    if ((status !== 'converting' && status !== 'processing') || smoothProgress >= 100 || !showEstimate) {
      return null;
    }

    // Calculate remaining time based on actual progress rate
    const progressRate = smoothProgress / Math.max(elapsedSeconds, 1);
    if (progressRate <= 0 || !isFinite(progressRate)) {
      return null;
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
