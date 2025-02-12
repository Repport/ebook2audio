
import { useState, useEffect, useCallback, useRef } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import { calculateSimulatedProgress } from '@/utils/progressSimulation';
import { supabase } from '@/integrations/supabase/client';

const CHUNK_SIZE = 4800;

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialProgress: number,
  estimatedSeconds: number,
  conversionId?: string | null,
  textLength?: number
) => {
  const [realProgress, setRealProgress] = useState(initialProgress);
  const [simulatedProgress, setSimulatedProgress] = useState(initialProgress);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [processedChunks, setProcessedChunks] = useState(0);
  const startTimeRef = useRef(Date.now());
  const simulationIntervalRef = useRef<number>();

  // Calcular número total de chunks cuando cambia el texto
  useEffect(() => {
    if (textLength) {
      const chunks = Math.ceil(textLength / CHUNK_SIZE);
      setTotalChunks(chunks);
      console.log(`Texto dividido en ${chunks} chunks (${textLength} caracteres)`);
    }
  }, [textLength]);

  // Manejar actualizaciones reales de progreso
  const handleProgressUpdate = useCallback((data: { 
    progress: number, 
    processed_chunks?: number | null, 
    total_chunks?: number | null 
  }) => {
    console.log('Actualización de progreso recibida:', data);
    const { progress, processed_chunks, total_chunks } = data;

    if (typeof progress === 'number' && progress >= 0) {
      setRealProgress(prev => Math.max(prev, progress));
    }

    if (typeof processed_chunks === 'number') {
      setProcessedChunks(prev => Math.max(prev, processed_chunks));
    }

    if (typeof total_chunks === 'number' && total_chunks > 0) {
      setTotalChunks(total_chunks);
    }
  }, []);

  // Configurar escucha de eventos en tiempo real
  useEffect(() => {
    let channel;
    
    if (conversionId && (status === 'converting' || status === 'processing')) {
      console.log('Configurando actualizaciones en tiempo real para conversión:', conversionId);
      
      // Obtener estado inicial
      supabase
        .from('text_conversions')
        .select('progress, processed_chunks, total_chunks')
        .eq('id', conversionId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error al obtener estado inicial:', error);
            return;
          }
          
          if (data) {
            console.log('Estado inicial:', data);
            handleProgressUpdate(data);
          }
        });
      
      // Configurar canal en tiempo real
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
              handleProgressUpdate(payload.new);
            }
          }
        )
        .subscribe((status) => {
          console.log(`Estado del canal ${channelName}:`, status);
        });
    }

    return () => {
      if (channel) {
        console.log('Limpiando suscripción en tiempo real');
        supabase.removeChannel(channel);
      }
    };
  }, [conversionId, status, handleProgressUpdate]);

  // Manejar la simulación de progreso
  useEffect(() => {
    if ((status === 'converting' || status === 'processing') && realProgress < 100) {
      // Actualizar tiempo transcurrido
      const elapsedInterval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Actualizar simulación de progreso
      simulationIntervalRef.current = window.setInterval(() => {
        setSimulatedProgress(prev => {
          const simulated = calculateSimulatedProgress(
            elapsedTime,
            totalChunks,
            processedChunks,
            realProgress
          );
          return Math.max(prev, simulated);
        });
      }, 200);

      return () => {
        clearInterval(elapsedInterval);
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
        }
      };
    }

    // Limpiar cuando se completa
    if (status === 'completed' || realProgress >= 100) {
      setElapsedTime(0);
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    }
  }, [status, realProgress, elapsedTime, totalChunks, processedChunks]);

  // Calcular tiempo restante estimado
  const getEstimatedTimeRemaining = useCallback(() => {
    if (realProgress >= 100 || status === 'completed') {
      return null;
    }

    if (processedChunks === 0) {
      return 'Calculando...';
    }

    const averageTimePerChunk = elapsedTime / processedChunks;
    const remainingChunks = totalChunks - processedChunks;
    const estimatedRemainingSeconds = Math.ceil(remainingChunks * averageTimePerChunk);

    return formatTimeRemaining(Math.max(estimatedRemainingSeconds, 5));
  }, [realProgress, status, processedChunks, totalChunks, elapsedTime]);

  const progress = Math.max(realProgress, simulatedProgress);

  return {
    progress,
    elapsedTime,
    timeRemaining: getEstimatedTimeRemaining(),
    hasStarted: progress > 0 || status === 'converting' || status === 'processing',
    processedChunks,
    totalChunks
  };
};
