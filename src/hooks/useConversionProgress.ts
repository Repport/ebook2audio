
import { useState, useEffect, useCallback, useRef } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import { supabase } from '@/integrations/supabase/client';
import { calculateSimulatedProgress } from '@/utils/progressSimulation';

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialProgress: number,
  estimatedSeconds: number,
  conversionId?: string | null,
  textLength?: number
) => {
  const [progress, setProgress] = useState(initialProgress);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [processedChunks, setProcessedChunks] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const startTimeRef = useRef(Date.now());
  const lastUpdateRef = useRef(Date.now());

  // Calcular el número total de chunks basado en la longitud del texto
  const calculatedTotalChunks = textLength ? Math.ceil(textLength / 4800) : 0;

  // Actualizar el progreso cuando cambian los chunks procesados
  useEffect(() => {
    if (processedChunks > 0 && totalChunks > 0) {
      const calculatedProgress = Math.min((processedChunks / totalChunks) * 100, 100);
      setProgress(prev => Math.max(prev, calculatedProgress));
      console.log(`Progreso actualizado: ${calculatedProgress}% (${processedChunks}/${totalChunks} chunks)`);
    }
  }, [processedChunks, totalChunks]);

  // Handle progress updates from realtime subscription
  const handleProgressUpdate = useCallback((data: { 
    progress: number, 
    processed_chunks?: number | null,
    total_chunks?: number | null 
  }) => {
    const currentTime = Date.now();
    console.log('Progress update received:', {
      ...data,
      timeSinceLastUpdate: currentTime - lastUpdateRef.current,
      calculatedTotalChunks
    });
    
    const { progress: newProgress, processed_chunks, total_chunks } = data;
    lastUpdateRef.current = currentTime;

    // Actualizar total_chunks considerando el valor calculado
    if (typeof total_chunks === 'number' && !isNaN(total_chunks) && total_chunks > 0) {
      setTotalChunks(total_chunks);
    } else if (calculatedTotalChunks > 0) {
      setTotalChunks(calculatedTotalChunks);
    }

    // Actualizar processed_chunks con validación
    if (typeof processed_chunks === 'number' && !isNaN(processed_chunks)) {
      setProcessedChunks(processed_chunks);
    }

    // Actualizar progress con validación
    if (typeof newProgress === 'number' && !isNaN(newProgress) && newProgress >= 0) {
      setProgress(prevProgress => Math.max(prevProgress, newProgress));
    }
  }, [calculatedTotalChunks]);

  // Set up realtime subscription
  useEffect(() => {
    let channel;
    
    if (conversionId && (status === 'converting' || status === 'processing')) {
      console.log('Setting up realtime updates for conversion:', {
        conversionId,
        calculatedTotalChunks,
        textLength
      });
      
      // Get initial state
      supabase
        .from('text_conversions')
        .select('progress, processed_chunks, total_chunks')
        .eq('id', conversionId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching initial state:', error);
            return;
          }
          
          if (data) {
            console.log('Initial conversion state:', data);
            handleProgressUpdate(data);
          }
        });
      
      // Set up realtime channel
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
            console.log('Realtime update received:', payload);
            if (payload.new) {
              handleProgressUpdate(payload.new);
            }
          }
        )
        .subscribe((status) => {
          console.log(`Realtime channel status (${conversionId}):`, status);
        });
    }

    return () => {
      if (channel) {
        console.log('Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [conversionId, status, handleProgressUpdate, calculatedTotalChunks, textLength]);

  // Incremento gradual del progreso si no hay actualizaciones
  useEffect(() => {
    let interval: number | undefined;

    if ((status === 'converting' || status === 'processing') && progress < 100) {
      interval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
        
        const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
        
        // Si no hemos recibido actualizaciones en 5 segundos, simular progreso
        if (timeSinceLastUpdate > 5000 && progress < 90) {
          const simulatedProgress = calculateSimulatedProgress(
            elapsed,
            totalChunks || calculatedTotalChunks,
            processedChunks,
            progress
          );
          setProgress(prev => Math.max(prev, simulatedProgress));

          console.log('Progreso simulado:', {
            simulatedProgress,
            elapsed,
            totalChunks,
            calculatedTotalChunks,
            processedChunks,
            currentProgress: progress
          });
        }
      }, 1000);
    } else if (status === 'completed' || progress >= 100) {
      setProgress(100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, progress, totalChunks, processedChunks, calculatedTotalChunks]);

  // Calculate estimated time remaining
  const getEstimatedTimeRemaining = useCallback(() => {
    if (progress >= 100 || status === 'completed') {
      return null;
    }

    const effectiveTotalChunks = totalChunks || calculatedTotalChunks;
    
    if (processedChunks === 0 || effectiveTotalChunks === 0) {
      return 'Calculating...';
    }

    const remainingChunks = effectiveTotalChunks - processedChunks;
    const avgTimePerChunk = elapsedTime / processedChunks;
    const estimatedRemainingSeconds = Math.ceil(remainingChunks * avgTimePerChunk);
    
    console.log('Time estimation:', {
      remainingChunks,
      avgTimePerChunk,
      estimatedRemainingSeconds,
      elapsedTime,
      processedChunks,
      effectiveTotalChunks,
      currentProgress: progress
    });

    return formatTimeRemaining(Math.max(estimatedRemainingSeconds, 5));
  }, [progress, status, totalChunks, processedChunks, elapsedTime, calculatedTotalChunks]);

  return {
    progress,
    elapsedTime,
    timeRemaining: getEstimatedTimeRemaining(),
    hasStarted: processedChunks > 0 || status === 'converting' || status === 'processing',
    processedChunks,
    totalChunks: totalChunks || calculatedTotalChunks
  };
};
