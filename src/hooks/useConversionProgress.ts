
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

  // Calcular el número total de chunks basado en la longitud del texto
  const calculatedTotalChunks = textLength ? Math.ceil(textLength / 4800) : 0;
  const effectiveTotalChunks = totalChunks || calculatedTotalChunks;

  const handleProgressUpdate = useProgressUpdates(
    setProgress,
    setProcessedChunks,
    setTotalChunks,
    lastUpdateRef,
    calculatedTotalChunks
  );

  const timeRemaining = useTimeEstimation(
    progress,
    status,
    processedChunks,
    elapsedTime,
    effectiveTotalChunks
  );

  // Actualizar el progreso cuando cambian los chunks procesados
  useEffect(() => {
    if (processedChunks > 0 && effectiveTotalChunks > 0) {
      const calculatedProgress = Math.min((processedChunks / effectiveTotalChunks) * 100, 100);
      setProgress(prev => Math.max(prev, calculatedProgress));
      console.log(`📊 Progress update from chunks: ${processedChunks}/${effectiveTotalChunks} chunks (${calculatedProgress.toFixed(1)}%)`);
    }
  }, [processedChunks, effectiveTotalChunks, setProgress]);

  // Suscripción a actualizaciones en tiempo real
  useRealtimeSubscription(
    conversionId,
    status,
    handleProgressUpdate,
    calculatedTotalChunks,
    textLength
  );

  // Actualizar el tiempo transcurrido
  useEffect(() => {
    let interval: number | undefined;

    if ((status === 'converting' || status === 'processing') && progress < 100) {
      interval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
        
        // Simular progreso si no hay actualizaciones recientes
        const timeSinceLastUpdate = (Date.now() - lastUpdateRef.current) / 1000;
        console.log(`⏳ Time since last update: ${timeSinceLastUpdate.toFixed(1)}s`);
        
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
              console.log('🤖 Simulated progress update:', {
                previous: prev.toFixed(1),
                new: newValue.toFixed(1),
                elapsed,
                chunks: `${processedChunks}/${effectiveTotalChunks}`
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

  // Animación de completado
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

  return {
    progress,
    elapsedTime,
    timeRemaining,
    hasStarted: processedChunks > 0 || status === 'converting' || status === 'processing',
    processedChunks,
    totalChunks: effectiveTotalChunks
  };
};
