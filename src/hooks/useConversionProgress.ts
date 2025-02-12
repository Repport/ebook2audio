
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
    console.log('Updating progress:', newProgress);
    setProgress(newProgress);
    setProgressHistory(prev => [...prev, [Date.now() - startTime, newProgress]]);
  }, [startTime]);

  // Handle initial progress
  useEffect(() => {
    if (initialProgress > 0 && initialProgress > progress) {
      console.log('Setting initial progress:', initialProgress);
      updateProgress(initialProgress);
    }
  }, [initialProgress, progress, updateProgress]);

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
            console.log('Received real-time update:', payload);
            const newProgress = payload.new.progress;
            
            if (typeof newProgress === 'number' && newProgress > progress) {
              updateProgress(newProgress);
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        console.log('Cleaning up real-time subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [conversionId, status, progress, updateProgress]);

  // Time tracking
  useEffect(() => {
    let intervalId: number;
    
    if (status === 'converting' || status === 'processing') {
      intervalId = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
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

    if (progressHistory.length < 2) {
      return formatTimeRemaining(estimatedSeconds);
    }

    // Calculate rate based on recent progress
    const recentHistory = progressHistory.slice(-5);
    if (recentHistory.length >= 2) {
      const [startTime, startProgress] = recentHistory[0];
      const [endTime, endProgress] = recentHistory[recentHistory.length - 1];
      const timeElapsed = (endTime - startTime) / 1000; // Convert to seconds
      const progressMade = endProgress - startProgress;
      
      if (timeElapsed > 0 && progressMade > 0) {
        const progressPerSecond = progressMade / timeElapsed;
        const remainingProgress = 100 - progress;
        const estimatedSeconds = Math.ceil(remainingProgress / progressPerSecond);
        return formatTimeRemaining(estimatedSeconds);
      }
    }

    return formatTimeRemaining(estimatedSeconds);
  }, [progress, status, progressHistory, estimatedSeconds]);

  return {
    progress,
    elapsedTime,
    timeRemaining: getEstimatedTimeRemaining(),
    hasStarted: progress > 0
  };
};
