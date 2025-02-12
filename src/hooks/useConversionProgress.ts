
import { useState, useEffect, useCallback } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import { supabase } from '@/integrations/supabase/client';

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialProgress: number,
  estimatedSeconds: number,
  conversionId?: string | null
) => {
  const [progress, setProgress] = useState(initialProgress);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [progressRate, setProgressRate] = useState<number | null>(null);

  const updateProgress = useCallback((newProgress: number) => {
    if (typeof newProgress === 'number' && newProgress >= 0) {
      const now = Date.now();
      const timeDiff = (now - lastUpdateTime) / 1000; // Convert to seconds
      const progressDiff = newProgress - progress;

      if (timeDiff > 0 && progressDiff > 0) {
        const rate = progressDiff / timeDiff;
        setProgressRate(rate);
      }

      setLastUpdateTime(now);
      setProgress(Math.min(100, Math.round(newProgress)));
      
      console.log('Progress update:', {
        newProgress,
        timeDiff,
        progressDiff,
        rate: progressRate
      });
    }
  }, [progress, lastUpdateTime, progressRate]);

  useEffect(() => {
    if (initialProgress > 0) {
      updateProgress(initialProgress);
    }
  }, [initialProgress, updateProgress]);

  useEffect(() => {
    let channel;
    
    if (conversionId && (status === 'converting' || status === 'processing')) {
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
            console.log('Realtime update:', payload.new);
            const newProgress = payload.new.progress;
            if (typeof newProgress === 'number') {
              updateProgress(newProgress);
            }
          }
        )
        .subscribe();

      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    }
  }, [conversionId, status, updateProgress]);

  useEffect(() => {
    let intervalId: number;
    
    if ((status === 'converting' || status === 'processing') && progress < 100) {
      intervalId = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (status === 'completed' || progress >= 100) {
      setElapsedTime(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status, progress]);

  const getEstimatedTimeRemaining = useCallback(() => {
    if (progress >= 100 || status === 'completed') {
      return null;
    }

    if (progressRate && progressRate > 0) {
      const remainingProgress = 100 - progress;
      const estimatedSeconds = Math.ceil(remainingProgress / progressRate);
      
      console.log('Time estimation:', {
        remainingProgress,
        progressRate,
        estimatedSeconds
      });
      
      return formatTimeRemaining(estimatedSeconds);
    }

    return formatTimeRemaining(Math.max(0, estimatedSeconds - elapsedTime));
  }, [progress, status, progressRate, estimatedSeconds, elapsedTime]);

  return {
    progress,
    elapsedTime,
    timeRemaining: getEstimatedTimeRemaining(),
    hasStarted: progress > 0 || status === 'converting' || status === 'processing'
  };
};
