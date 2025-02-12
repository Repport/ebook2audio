
import { useState, useEffect, useCallback } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import { supabase } from '@/integrations/supabase/client';

interface ProgressUpdate {
  timestamp: number;
  progress: number;
}

const CHUNK_SIZE = 4800; // API limit per chunk
const CHUNK_PROCESSING_TIME = 3; // segundos estimados por chunk
const FINALIZATION_TIME = 10; // segundos extra para combinar archivos

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialProgress: number,
  estimatedSeconds: number,
  conversionId?: string | null,
  textLength?: number
) => {
  const [progress, setProgress] = useState(initialProgress);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  const [totalChunks, setTotalChunks] = useState(0);
  const [processedChunks, setProcessedChunks] = useState(0);

  // Calcular el número total de chunks basado en la longitud del texto
  useEffect(() => {
    if (textLength) {
      const chunks = Math.ceil(textLength / CHUNK_SIZE);
      setTotalChunks(chunks);
      console.log(`Texto dividido en ${chunks} chunks (${textLength} caracteres)`);
    }
  }, [textLength]);

  // Actualizar el progreso basado en los chunks procesados
  const updateProgress = useCallback((newProgress: number) => {
    if (typeof newProgress !== 'number' || newProgress < 0) {
      console.warn('Invalid progress value:', newProgress);
      return;
    }

    // Calcular cuántos chunks se han procesado basado en el progreso
    const chunksCompleted = Math.floor((newProgress / 100) * totalChunks);
    setProcessedChunks(chunksCompleted);

    // Calcular el progreso total incluyendo el tiempo de finalización
    const chunkProgress = (chunksCompleted / totalChunks) * 90; // 90% para procesamiento
    const finalizationProgress = newProgress >= 95 ? (newProgress - 95) * 2 : 0; // 10% para finalización
    const totalProgress = Math.min(100, chunkProgress + finalizationProgress);

    console.log('Progress update:', {
      chunks: `${chunksCompleted}/${totalChunks}`,
      chunkProgress,
      finalizationProgress,
      totalProgress
    });

    setProgress(Math.round(totalProgress));
  }, [totalChunks]);

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
        .subscribe((status) => {
          console.log('Channel status:', status);
        });

      return () => {
        console.log('Cleaning up realtime subscription');
        if (channel) {
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

    // Calcular tiempo restante basado en chunks y tiempo de procesamiento
    const remainingChunks = totalChunks - processedChunks;
    const remainingChunkTime = remainingChunks * CHUNK_PROCESSING_TIME;
    const remainingFinalizationTime = progress < 90 ? FINALIZATION_TIME : 
      Math.round((FINALIZATION_TIME * (100 - progress)) / 10);

    const totalRemainingTime = remainingChunkTime + remainingFinalizationTime;
    return formatTimeRemaining(Math.max(0, totalRemainingTime));
  }, [progress, status, totalChunks, processedChunks]);

  return {
    progress,
    elapsedTime,
    timeRemaining: getEstimatedTimeRemaining(),
    hasStarted: progress > 0 || status === 'converting' || status === 'processing',
    processedChunks,
    totalChunks
  };
};
