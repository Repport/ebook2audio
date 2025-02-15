
import { useCallback, useEffect } from 'react';
import { useProgressState } from './conversion/useProgressState';
import { useTimeTracking } from './conversion/useTimeTracking';
import { useProgressUpdates } from './conversion/useProgressUpdates';
import { useTimeEstimation } from './conversion/useTimeEstimation';
import { useRealtimeSubscription } from './conversion/useRealtimeSubscription';
import { calculateSimulatedProgress } from '@/utils/progressSimulation';

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialProgress: number,
  estimatedSeconds: number,
  conversionId?: string | null,
  textLength?: number
) => {
  const {
    progress,
    setProgress,
    elapsedTime,
    setElapsedTime,
    processedChunks,
    setProcessedChunks,
    totalChunks,
    setTotalChunks
  } = useProgressState(initialProgress);

  const { startTimeRef, lastUpdateRef } = useTimeTracking();

  const calculatedTotalChunks = textLength ? Math.ceil(textLength / 4800) : 0;
  const effectiveTotalChunks = totalChunks || calculatedTotalChunks;

  const handleProgressUpdate = useProgressUpdates(
    setProgress,
    setProcessedChunks,
    setTotalChunks,
    lastUpdateRef,
    calculatedTotalChunks
  );

  const getEstimatedTimeRemaining = useTimeEstimation(
    progress,
    status,
    processedChunks,
    elapsedTime,
    effectiveTotalChunks
  );

  useEffect(() => {
    if (processedChunks > 0 && effectiveTotalChunks > 0) {
      setProgress(prev => {
        const newProgress = Math.min((processedChunks / effectiveTotalChunks) * 100, 100);
        return newProgress > prev ? newProgress : prev;
      });
      console.log(`📊 Progress update: ${processedChunks}/${effectiveTotalChunks} chunks (${Math.round(progress)}%)`);
    }
  }, [processedChunks, effectiveTotalChunks, progress, setProgress]);

  useRealtimeSubscription(
    conversionId,
    status,
    handleProgressUpdate,
    calculatedTotalChunks,
    textLength
  );

  // Avance mínimo garantizado
  useEffect(() => {
    let interval: number | undefined;

    if ((status === 'converting' || status === 'processing') && progress < 100) {
      interval = window.setInterval(() => {
        setProgress(prev => {
          const newValue = Math.min(prev + 0.5, 90);
          if (newValue !== prev) {
            console.log('🔄 Minimum progress increment:', {
              previous: prev.toFixed(1),
              new: newValue.toFixed(1)
            });
          }
          return newValue;
        });
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, progress, setProgress]);

  // Animación al completar
  useEffect(() => {
    if (status === 'completed' && progress < 100) {
      console.log('🎉 Animating completion...');
      const startValue = progress;
      const startTime = performance.now();
      const duration = 500;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
        const currentProgress = startValue + (100 - startValue) * easeOut(progress);
        
        setProgress(currentProgress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [status, progress, setProgress]);

  // Simulación de progreso
  useEffect(() => {
    let interval: number | undefined;

    if ((status === 'converting' || status === 'processing') && progress < 100) {
      interval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
        
        const timeSinceLastUpdate = (Date.now() - lastUpdateRef.current) / 1000;
        console.log(`⏳ Última actualización hace: ${timeSinceLastUpdate.toFixed(1)}s`);
        
        if (timeSinceLastUpdate > 5 && progress < 90) {
          const simulatedProgress = calculateSimulatedProgress(
            elapsed,
            effectiveTotalChunks,
            processedChunks,
            progress
          );
          
          setProgress(prev => {
            const newValue = Math.max(prev, simulatedProgress);
            if (newValue !== prev) {
              console.log('🤖 Simulated progress:', {
                previous: prev.toFixed(1),
                new: newValue.toFixed(1),
                elapsed,
                effectiveTotalChunks,
                processedChunks
              });
            }
            return newValue;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, progress, effectiveTotalChunks, processedChunks, setProgress, setElapsedTime]);

  return {
    progress,
    elapsedTime,
    timeRemaining: getEstimatedTimeRemaining(),
    hasStarted: processedChunks > 0 || status === 'converting' || status === 'processing',
    processedChunks,
    totalChunks: effectiveTotalChunks
  };
};
