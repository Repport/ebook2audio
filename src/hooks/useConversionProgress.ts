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

  // Avance mínimo garantizado en caso de inactividad
  useEffect(() => {
    let interval: number | undefined;

    if ((status === 'converting' || status === 'processing') && progress < 100) {
      interval = window.setInterval(() => {
        setProgress(prev => {
          const newValue = Math.min(prev + 0.5, 90); // Limitar a 90% para evitar falsos completados
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
  }, [status, progress]);

  // Animación suave al completar
  useEffect(() => {
    if (status === 'completed' && progress < 100) {
      console.log('🎉 Animating completion...');
      const startValue = progress;
      const startTime = performance.now();
      const duration = 500; // 500ms de duración

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Función de easing para una animación más suave
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
        const currentProgress = startValue + (100 - startValue) * easeOut(progress);
        
        setProgress(currentProgress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [status, progress]);

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

    if (processedChunks === 0 || effectiveTotalChunks === 0 || elapsedTime === 0) {
      return 'Calculating...';
    }

    // Usar la media móvil de los últimos 5 tiempos por chunk
    const avgTimePerChunk = elapsedTime / processedChunks;
    const estimatedRemainingSeconds = Math.ceil((effectiveTotalChunks - processedChunks) * avgTimePerChunk);

    // Evitar valores negativos o irreales
    const safeEstimatedTime = Math.max(estimatedRemainingSeconds, 5);

    console.log('⏱️ Time estimation:', {
      remainingChunks: effectiveTotalChunks - processedChunks,
      avgTimePerChunk: `${avgTimePerChunk.toFixed(1)}s`,
      estimatedRemainingSeconds,
      elapsedTime,
      processedChunks,
      effectiveTotalChunks,
      currentProgress: `${progress.toFixed(1)}%`
    });

    return formatTimeRemaining(safeEstimatedTime);
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
