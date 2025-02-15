
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
  const effectiveTotalChunks = totalChunks || calculatedTotalChunks;

  // Optimización de setProgress para evitar renders innecesarios
  useEffect(() => {
    if (processedChunks > 0 && effectiveTotalChunks > 0) {
      setProgress(prev => {
        const newProgress = Math.min((processedChunks / effectiveTotalChunks) * 100, 100);
        return newProgress > prev ? newProgress : prev;
      });
      console.log(`📊 Progress update: ${processedChunks}/${effectiveTotalChunks} chunks (${Math.round(progress)}%)`);
    }
  }, [processedChunks, effectiveTotalChunks, progress]);

  // Manejo optimizado de actualizaciones de progreso
  const handleProgressUpdate = useCallback((data: { 
    progress: number, 
    processed_chunks?: number | null,
    total_chunks?: number | null 
  }) => {
    const currentTime = Date.now();
    const timeSinceLastUpdate = (currentTime - lastUpdateRef.current) / 1000;
    
    console.log('⚡ Progress update received:', {
      ...data,
      timeSinceLastUpdate: `${timeSinceLastUpdate.toFixed(1)}s`,
      calculatedTotalChunks,
      effectiveTotalChunks
    });
    
    const { progress: newProgress, processed_chunks, total_chunks } = data;
    lastUpdateRef.current = currentTime;

    // Actualizar total_chunks con validación
    if (typeof total_chunks === 'number' && !isNaN(total_chunks) && total_chunks > 0) {
      setTotalChunks(total_chunks);
    } else if (calculatedTotalChunks > 0) {
      setTotalChunks(calculatedTotalChunks);
    }

    // Actualizar processed_chunks con validación
    if (typeof processed_chunks === 'number' && !isNaN(processed_chunks)) {
      setProcessedChunks(prev => {
        const newValue = Math.max(prev, processed_chunks);
        console.log(`📈 Processed chunks updated: ${prev} -> ${newValue}`);
        return newValue;
      });
    }

    // Actualizar progress con validación
    if (typeof newProgress === 'number' && !isNaN(newProgress) && newProgress >= 0) {
      setProgress(prev => {
        const newValue = Math.max(prev, newProgress);
        console.log(`🎯 Progress updated: ${prev.toFixed(1)}% -> ${newValue.toFixed(1)}%`);
        return newValue;
      });
    }
  }, [calculatedTotalChunks]);

  // Suscripción en tiempo real mejorada
  useEffect(() => {
    let channel;
    
    if (conversionId && (status === 'converting' || status === 'processing')) {
      console.log('🔌 Setting up realtime updates:', {
        conversionId,
        calculatedTotalChunks,
        textLength
      });
      
      // Obtener estado inicial
      supabase
        .from('text_conversions')
        .select('progress, processed_chunks, total_chunks')
        .eq('id', conversionId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ Error fetching initial state:', error);
            return;
          }
          if (data) {
            console.log('📝 Initial state:', data);
            handleProgressUpdate(data);
          }
        });
      
      // Configurar canal en tiempo real
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
            console.log('⚡ Realtime update received:', payload);
            if (payload.new) {
              handleProgressUpdate(payload.new);
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 Channel status (${conversionId}):`, status);
        });
    }

    return () => {
      if (channel) {
        console.log('🔌 Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [conversionId, status, handleProgressUpdate, calculatedTotalChunks, textLength]);

  // Simulación de progreso mejorada
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
    } else if (status === 'completed' || progress >= 100) {
      setProgress(100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, progress, effectiveTotalChunks, processedChunks]);

  // Cálculo mejorado del tiempo restante
  const getEstimatedTimeRemaining = useCallback(() => {
    if (progress >= 100 || status === 'completed') {
      return null;
    }
    
    if (processedChunks === 0 || effectiveTotalChunks === 0) {
      return 'Calculating...';
    }

    const remainingChunks = effectiveTotalChunks - processedChunks;
    const avgTimePerChunk = elapsedTime / processedChunks;
    const estimatedRemainingSeconds = Math.ceil(remainingChunks * avgTimePerChunk);
    
    console.log('⏱️ Time estimation:', {
      remainingChunks,
      avgTimePerChunk: `${avgTimePerChunk.toFixed(1)}s`,
      estimatedRemainingSeconds,
      elapsedTime,
      processedChunks,
      effectiveTotalChunks,
      currentProgress: `${progress.toFixed(1)}%`
    });

    return formatTimeRemaining(Math.max(estimatedRemainingSeconds, 5));
  }, [progress, status, processedChunks, elapsedTime, effectiveTotalChunks]);

  return {
    progress,
    elapsedTime,
    timeRemaining: getEstimatedTimeRemaining(),
    hasStarted: processedChunks > 0 || status === 'converting' || status === 'processing',
    processedChunks,
    totalChunks: effectiveTotalChunks
  };
};
