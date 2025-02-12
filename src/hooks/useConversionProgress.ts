
import { useState, useEffect, useCallback } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import { supabase } from '@/integrations/supabase/client';

interface ProgressUpdate {
  timestamp: number;
  progress: number;
}

const CHUNK_SIZE = 4800;
const CHUNK_PROCESSING_TIME = 6;
const FINALIZATION_TIME = 15;

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
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // Aseguramos que el progreso nunca retroceda
  const updateProgress = useCallback((progressData: { progress: number, processed_chunks?: number | null, total_chunks?: number | null }) => {
    console.log('Progress update received:', progressData);
    const { progress: newProgress, processed_chunks, total_chunks } = progressData;

    if (typeof newProgress === 'number' && newProgress >= 0) {
      setProgress(prev => Math.max(prev, Math.round(newProgress)));
    }

    if (typeof processed_chunks === 'number') {
      setProcessedChunks(prev => Math.max(prev, processed_chunks));
      setLastUpdateTime(Date.now());
    }

    if (typeof total_chunks === 'number' && total_chunks > 0) {
      setTotalChunks(total_chunks);
    }
  }, []);

  useEffect(() => {
    if (textLength) {
      const chunks = Math.ceil(textLength / CHUNK_SIZE);
      setTotalChunks(chunks);
      console.log(`Text divided into ${chunks} chunks (${textLength} characters)`);
    }
  }, [textLength]);

  useEffect(() => {
    let channel;
    
    if (conversionId && (status === 'converting' || status === 'processing')) {
      console.log('Setting up realtime updates for conversion:', conversionId);
      
      // Primero obtenemos el estado inicial
      supabase
        .from('text_conversions')
        .select('progress, processed_chunks, total_chunks')
        .eq('id', conversionId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching initial conversion state:', error);
            return;
          }
          
          if (data) {
            console.log('Initial conversion state:', data);
            updateProgress({
              progress: data.progress ?? 0,
              processed_chunks: data.processed_chunks,
              total_chunks: data.total_chunks
            });
          }
        });
      
      // Luego configuramos las actualizaciones en tiempo real
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
            console.log('Realtime update received:', payload);
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
          console.log(`Channel ${channelName} status:`, status);
        });

      return () => {
        console.log('Cleaning up realtime subscription');
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

    if (processedChunks === 0 || totalChunks === 0) {
      return 'Calculando...';
    }

    const timePerChunk = (Date.now() - startTime) / processedChunks;
    const remainingChunks = totalChunks - processedChunks;
    
    const remainingProcessingTime = Math.ceil((remainingChunks * timePerChunk) / 1000);
    const remainingFinalizationTime = progress < 90 ? FINALIZATION_TIME : 
      Math.round((FINALIZATION_TIME * (100 - progress)) / 10);

    const totalRemainingTime = remainingProcessingTime + remainingFinalizationTime;
    const adjustedTime = Math.max(Math.ceil(totalRemainingTime * 1.1), 5);
    
    return formatTimeRemaining(adjustedTime);
  }, [progress, status, totalChunks, processedChunks, startTime]);

  return {
    progress,
    elapsedTime,
    timeRemaining: getEstimatedTimeRemaining(),
    hasStarted: progress > 0 || status === 'converting' || status === 'processing',
    processedChunks,
    totalChunks
  };
};
