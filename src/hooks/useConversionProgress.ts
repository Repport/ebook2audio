
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

  // Update progress both from props and real-time updates
  useEffect(() => {
    setSmoothProgress(prev => {
      // Only update if new progress is higher
      return progress > prev ? progress : prev;
    });
  }, [progress]);

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
            console.log('Received real-time progress update:', payload);
            const newProgress = payload.new.progress;
            
            if (typeof newProgress === 'number') {
              setSmoothProgress(prev => newProgress > prev ? newProgress : prev);
            }
          }
        )
        .subscribe((status) => {
          console.log('Real-time subscription status:', status);
        });
    }

    return () => {
      if (channel) {
        console.log('Cleaning up real-time subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [conversionId, status]);

  // Track elapsed time and adjust estimation
  useEffect(() => {
    let intervalId: number;
    
    if (status === 'converting' || status === 'processing') {
      intervalId = window.setInterval(() => {
        setElapsedSeconds(prev => {
          const newElapsed = prev + 1;
          
          // Start showing estimate after we have some progress
          if (smoothProgress > 0) {
            setShowEstimate(true);
            
            // Calculate new estimate based on current progress rate
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
    if (!showEstimate || smoothProgress >= 100 || (status !== 'converting' && status !== 'processing')) {
      return null;
    }

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
    timeRemaining: getEstimatedTimeRemaining(),
    elapsedSeconds
  };
};
