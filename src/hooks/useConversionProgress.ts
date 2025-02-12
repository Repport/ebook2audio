
import { useState, useEffect, useCallback, useRef } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import { calculateSimulatedProgress } from '@/utils/progressSimulation';
import { supabase } from '@/integrations/supabase/client';

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialProgress: number,
  estimatedSeconds: number,
  conversionId?: string | null,
  textLength?: number
) => {
  const [progress, setProgress] = useState(initialProgress);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [processedCharacters, setProcessedCharacters] = useState(0);
  const [totalCharacters, setTotalCharacters] = useState(textLength || 0);
  const startTimeRef = useRef(Date.now());

  // Handle progress updates from realtime subscription
  const handleProgressUpdate = useCallback((data: { 
    progress: number, 
    processed_characters?: number | null,
    total_characters?: number | null 
  }) => {
    console.log('Progress update received:', data);
    const { progress: newProgress, processed_characters, total_characters } = data;

    if (typeof newProgress === 'number' && newProgress >= 0) {
      setProgress(Math.max(newProgress, 0));
    }

    if (typeof processed_characters === 'number') {
      setProcessedCharacters(processed_characters);
    }

    if (typeof total_characters === 'number' && total_characters > 0) {
      setTotalCharacters(total_characters);
    }
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    let channel;
    
    if (conversionId && (status === 'converting' || status === 'processing')) {
      console.log('Setting up realtime updates for conversion:', conversionId);
      
      // Get initial state
      supabase
        .from('text_conversions')
        .select('progress, processed_characters, total_characters')
        .eq('id', conversionId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching initial state:', error);
            return;
          }
          
          if (data) {
            console.log('Initial state:', data);
            handleProgressUpdate(data);
          }
        });
      
      // Set up realtime channel
      channel = supabase
        .channel(`conversion-${conversionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'text_conversions',
            filter: `id=eq.${conversionId}`,
          },
          (payload: any) => {
            console.log('Realtime update received:', payload);
            if (payload.new) {
              handleProgressUpdate(payload.new);
            }
          }
        )
        .subscribe((status) => {
          console.log(`Channel status (${conversionId}):`, status);
        });
    }

    return () => {
      if (channel) {
        console.log('Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [conversionId, status, handleProgressUpdate]);

  // Update elapsed time
  useEffect(() => {
    let interval: number | undefined;

    if ((status === 'converting' || status === 'processing') && progress < 100) {
      interval = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else if (status === 'completed' || progress >= 100) {
      setElapsedTime(prev => prev); // Keep final elapsed time
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, progress]);

  // Calculate estimated time remaining
  const getEstimatedTimeRemaining = useCallback(() => {
    if (progress >= 100 || status === 'completed') {
      return null;
    }

    if (progress === 0) {
      return 'Calculating...';
    }

    // Calculate based on elapsed time and progress
    const timePerPercent = elapsedTime / progress;
    const remainingPercent = 100 - progress;
    const estimatedRemainingSeconds = Math.ceil(timePerPercent * remainingPercent);

    return formatTimeRemaining(Math.max(estimatedRemainingSeconds, 5));
  }, [progress, status, elapsedTime]);

  return {
    progress,
    elapsedTime,
    timeRemaining: getEstimatedTimeRemaining(),
    hasStarted: progress > 0 || status === 'converting' || status === 'processing',
    processedCharacters,
    totalCharacters
  };
};
