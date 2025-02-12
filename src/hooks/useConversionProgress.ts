
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
  const [progressHistory, setProgressHistory] = useState<Array<[number, number]>>([]);

  const updateProgress = useCallback((newProgress: number) => {
    if (typeof newProgress === 'number' && newProgress >= 0) {
      console.log('Updating progress:', newProgress);
      const roundedProgress = Math.min(100, Math.round(newProgress));
      setProgress(roundedProgress);
      setProgressHistory(prev => [...prev, [Date.now() - startTime, roundedProgress]]);
    }
  }, [startTime]);

  useEffect(() => {
    if (initialProgress > 0) {
      console.log('Setting initial progress:', initialProgress);
      updateProgress(initialProgress);
    }
  }, [initialProgress, updateProgress]);

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
            console.log('Received real-time update:', payload);
            const newProgress = payload.new.progress;
            
            if (typeof newProgress === 'number' && newProgress !== progress) {
              updateProgress(newProgress);
            }
          }
        )
        .subscribe();

      return () => {
        if (channel) {
          console.log('Cleaning up real-time subscription');
          supabase.removeChannel(channel);
        }
      };
    }
  }, [conversionId, status, progress, updateProgress]);

  useEffect(() => {
    let intervalId: number;
    
    if (status === 'converting' || status === 'processing') {
      intervalId = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (status === 'completed') {
      setElapsedTime(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status]);

  const getEstimatedTimeRemaining = useCallback(() => {
    if (progress >= 100 || status === 'completed') {
      return null;
    }

    // Calculate based on recent progress rate
    const recentHistory = progressHistory.slice(-3);
    if (recentHistory.length >= 2) {
      const [startTime, startProgress] = recentHistory[0];
      const [endTime, endProgress] = recentHistory[recentHistory.length - 1];
      const timeElapsed = (endTime - startTime) / 1000; // Convert to seconds
      const progressMade = endProgress - startProgress;
      
      if (timeElapsed > 0 && progressMade > 0) {
        const progressPerSecond = progressMade / timeElapsed;
        if (progressPerSecond > 0) {
          const remainingProgress = 100 - progress;
          const estimatedSeconds = Math.ceil(remainingProgress / progressPerSecond);
          console.log('Estimated seconds remaining:', estimatedSeconds, {
            progressPerSecond,
            remainingProgress,
            timeElapsed,
            progressMade
          });
          return formatTimeRemaining(estimatedSeconds);
        }
      }
    }

    // Fallback to initial estimate if we can't calculate based on progress
    const remainingTime = Math.max(0, estimatedSeconds - elapsedTime);
    console.log('Using fallback time estimate:', remainingTime);
    return formatTimeRemaining(remainingTime);
  }, [progress, status, progressHistory, estimatedSeconds, elapsedTime]);

  return {
    progress,
    elapsedTime,
    timeRemaining: getEstimatedTimeRemaining(),
    hasStarted: progress > 0 || status === 'converting' || status === 'processing'
  };
};
