
import { useState, useEffect, useCallback } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import { supabase } from '@/integrations/supabase/client';

interface ProgressUpdate {
  timestamp: number;
  progress: number;
}

const CHUNK_SIZE = 4800;
const CHUNK_PROCESSING_TIME = 3;
const FINALIZATION_TIME = 10;

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

  useEffect(() => {
    if (textLength) {
      const chunks = Math.ceil(textLength / CHUNK_SIZE);
      setTotalChunks(chunks);
      console.log(`Texto dividido en ${chunks} chunks (${textLength} caracteres)`);
    }
  }, [textLength]);

  const updateProgress = useCallback((progressData: { progress: number, processed_chunks?: number, total_chunks?: number }) => {
    console.log('Recibida actualización de progreso:', progressData);
    const { progress: newProgress, processed_chunks, total_chunks } = progressData;

    if (typeof newProgress === 'number' && newProgress >= 0) {
      setProgress(Math.round(newProgress));
    }

    if (typeof processed_chunks === 'number') {
      setProcessedChunks(processed_chunks);
    }

    if (typeof total_chunks === 'number') {
      setTotalChunks(total_chunks);
    }
  }, []);

  useEffect(() => {
    let channel;
    
    if (conversionId && (status === 'converting' || status === 'processing')) {
      console.log('Configurando actualizaciones en tiempo real para conversión:', conversionId);
      
      // Crear un canal específico para esta conversión
      const channelName = `conversion-${conversionId}`;
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'text_conversions',
            filter: `id=eq.${conversionId}`,
          },
          (payload: any) => {
            console.log('Actualización en tiempo real recibida:', payload);
            if (payload.new) {
              const { progress = 0, processed_chunks, total_chunks } = payload.new;
              updateProgress({
                progress,
                processed_chunks,
                total_chunks
              });
            }
          }
        )
        .subscribe((status) => {
          console.log(`Estado del canal ${channelName}:`, status);
        });

      // Hacer una consulta inicial para obtener el estado actual
      supabase
        .from('text_conversions')
        .select('progress, processed_chunks, total_chunks')
        .eq('id', conversionId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            console.log('Estado inicial de la conversión:', data);
            const { progress = 0, processed_chunks, total_chunks } = data;
            updateProgress({
              progress,
              processed_chunks,
              total_chunks
            });
          } else {
            console.error('Error fetching initial conversion state:', error);
          }
        });

      return () => {
        console.log('Limpiando suscripción en tiempo real');
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
