
import { useCallback, useEffect, useRef } from 'react';
import { useProgressState } from './conversion/useProgressState';
import { useTimeTracking } from './conversion/useTimeTracking';
import { useProgressUpdates } from './conversion/useProgressUpdates';
import { useTimeEstimation } from './conversion/useTimeEstimation';
import { useRealtimeSubscription } from './conversion/useRealtimeSubscription';
import { calculateSimulatedProgress } from '@/utils/progressSimulation';
import { supabase } from '@/integrations/supabase/client';

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
  const batchUpdateTimeoutRef = useRef<number | null>(null);
  const processedCharactersRef = useRef<number>(0);

  // Calcular el número total de caracteres
  const totalCharacters = textLength || 0;

  const handleProgressUpdate = useProgressUpdates(
    setProgress,
    setProcessedChunks,
    setTotalChunks,
    lastUpdateRef,
    Math.ceil(totalCharacters / 4800)
  );

  const timeRemaining = useTimeEstimation(
    progress,
    status,
    processedCharactersRef.current,
    elapsedTime,
    totalCharacters
  );

  // Función para actualizar el progreso en Supabase en lotes
  const updateProgressInBatches = useCallback(async () => {
    if (conversionId && processedCharactersRef.current > 0) {
      console.log('📝 Batch updating progress in Supabase:', {
        processed: processedCharactersRef.current,
        total: totalCharacters
      });

      const calculatedProgress = Math.min(
        (processedCharactersRef.current / totalCharacters) * 100,
        99
      );

      await supabase
        .from('text_conversions')
        .update({
          processed_characters: processedCharactersRef.current,
          progress: calculatedProgress,
        })
        .eq('id', conversionId);
    }
  }, [conversionId, totalCharacters]);

  // Configurar intervalo para actualizaciones en lote
  useEffect(() => {
    if (status === 'converting' || status === 'processing') {
      const interval = setInterval(updateProgressInBatches, 5000);
      return () => clearInterval(interval);
    }
  }, [status, updateProgressInBatches]);

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
            Math.ceil(totalCharacters / 4800),
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
                processed: processedCharactersRef.current,
                total: totalCharacters
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
  }, [status, progress, totalCharacters, processedChunks, setProgress, setElapsedTime]);

  // Suscripción a actualizaciones en tiempo real
  useRealtimeSubscription(
    conversionId,
    status,
    handleProgressUpdate,
    Math.ceil(totalCharacters / 4800),
    textLength
  );

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
    hasStarted: processedCharactersRef.current > 0 || status === 'converting' || status === 'processing',
    processedChunks,
    totalChunks: Math.ceil(totalCharacters / 4800)
  };
};
