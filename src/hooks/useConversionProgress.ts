
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

  // Handle progress updates from both props and real-time
  useEffect(() => {
    // Always update progress to ensure initial value is set
    setSmoothProgress(progress);
    console.log('Progress updated:', progress);
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
            console.log('Received real-time update:', payload);
            const newProgress = payload.new.progress;
            
            if (typeof newProgress === 'number') {
              setSmoothProgress(newProgress);
              console.log('Updated progress:', newProgress);
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

  // Track elapsed time and handle estimation
  useEffect(() => {
    let intervalId: number;
    
    if (status === 'converting' || status === 'processing') {
      intervalId = window.setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      // Show estimate once we have any progress
      if (progress > 0) {
        setShowEstimate(true);
      }
    } else {
      setElapsedSeconds(0);
      setShowEstimate(false);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status, progress]);

  const getEstimatedTimeRemaining = () => {
    if (!showEstimate || smoothProgress >= 100) {
      return null;
    }

    if (smoothProgress <= 0 || elapsedSeconds <= 0) {
      return formatTimeRemaining(estimatedSeconds);
    }

    const progressRate = smoothProgress / elapsedSeconds;
    if (progressRate <= 0) {
      return formatTimeRemaining(estimatedSeconds);
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
