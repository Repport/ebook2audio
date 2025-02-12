
import { useState, useEffect, useCallback } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import { supabase } from '@/integrations/supabase/client';

interface ProgressUpdate {
  timestamp: number;
  progress: number;
}

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialProgress: number,
  estimatedSeconds: number,
  conversionId?: string | null
) => {
  const [progress, setProgress] = useState(initialProgress);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  // Mantener un historial de las últimas actualizaciones de progreso
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [lastCalculatedRate, setLastCalculatedRate] = useState<number | null>(null);

  // Función para calcular la tasa de progreso actual
  const calculateProgressRate = useCallback((updates: ProgressUpdate[]) => {
    if (updates.length < 2) return null;

    // Usar las últimas 2 actualizaciones para calcular la tasa
    const recent = updates.slice(-2);
    const timeDiff = (recent[1].timestamp - recent[0].timestamp) / 1000; // en segundos
    const progressDiff = recent[1].progress - recent[0].progress;

    if (timeDiff <= 0 || progressDiff <= 0) return null;

    const rate = progressDiff / timeDiff; // progreso por segundo
    console.log('Calculated progress rate:', {
      timeDiff,
      progressDiff,
      rate,
      recent
    });
    
    return rate;
  }, []);

  const updateProgress = useCallback((newProgress: number) => {
    if (typeof newProgress !== 'number' || newProgress < 0) {
      console.warn('Invalid progress value:', newProgress);
      return;
    }

    const now = Date.now();
    const roundedProgress = Math.min(100, Math.round(newProgress));
    
    console.log('Progress update received:', {
      previous: progress,
      new: roundedProgress,
      timestamp: now,
      timeSinceStart: (now - startTime) / 1000
    });

    setProgress(roundedProgress);
    setProgressUpdates(prev => {
      const update = { timestamp: now, progress: roundedProgress };
      // Mantener solo las últimas 5 actualizaciones
      const newUpdates = [...prev.slice(-4), update];
      
      const rate = calculateProgressRate(newUpdates);
      if (rate !== null) {
        setLastCalculatedRate(rate);
      }
      
      return newUpdates;
    });
  }, [progress, startTime, calculateProgressRate]);

  // Efecto para manejar el progreso inicial
  useEffect(() => {
    if (initialProgress > 0) {
      console.log('Setting initial progress:', initialProgress);
      updateProgress(initialProgress);
    }
  }, [initialProgress, updateProgress]);

  // Efecto para las actualizaciones en tiempo real
  useEffect(() => {
    let channel;
    
    if (conversionId && (status === 'converting' || status === 'processing')) {
      console.log('Setting up realtime updates for conversion:', conversionId);
      
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
            console.log('Realtime update received:', payload.new);
            const newProgress = payload.new.progress;
            if (typeof newProgress === 'number') {
              updateProgress(newProgress);
            }
          }
        )
        .subscribe();

      return () => {
        if (channel) {
          console.log('Cleaning up realtime subscription');
          supabase.removeChannel(channel);
        }
      };
    }
  }, [conversionId, status, updateProgress]);

  // Efecto para el tiempo transcurrido
  useEffect(() => {
    let intervalId: number;
    
    if ((status === 'converting' || status === 'processing') && progress < 100) {
      intervalId = window.setInterval(() => {
        setElapsedTime(prev => {
          const newElapsed = prev + 1;
          console.log('Elapsed time updated:', newElapsed);
          return newElapsed;
        });
      }, 1000);
    } else if (status === 'completed' || progress >= 100) {
      console.log('Resetting elapsed time - conversion completed');
      setElapsedTime(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status, progress]);

  // Función para calcular el tiempo restante
  const getEstimatedTimeRemaining = useCallback(() => {
    if (progress >= 100 || status === 'completed') {
      return null;
    }

    // Si tenemos una tasa de progreso calculada, usarla
    if (lastCalculatedRate && lastCalculatedRate > 0) {
      const remainingProgress = 100 - progress;
      const estimatedSeconds = Math.ceil(remainingProgress / lastCalculatedRate);
      
      console.log('Time estimation based on rate:', {
        remainingProgress,
        progressRate: lastCalculatedRate,
        estimatedSeconds,
        currentProgress: progress
      });
      
      return formatTimeRemaining(estimatedSeconds);
    }

    // Fallback al tiempo estimado inicial
    const remainingTime = Math.max(0, estimatedSeconds - elapsedTime);
    console.log('Time estimation fallback:', {
      estimatedSeconds,
      elapsedTime,
      remainingTime,
      currentProgress: progress
    });
    
    return formatTimeRemaining(remainingTime);
  }, [progress, status, lastCalculatedRate, estimatedSeconds, elapsedTime]);

  return {
    progress,
    elapsedTime,
    timeRemaining: getEstimatedTimeRemaining(),
    hasStarted: progress > 0 || status === 'converting' || status === 'processing'
  };
};
