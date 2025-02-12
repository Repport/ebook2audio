
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
  const [processedCharacters, setProcessedCharacters] = useState(0);
  const [totalCharacters, setTotalCharacters] = useState(textLength || 0);
  const startTimeRef = useRef(Date.now());
  const simulationIntervalRef = useRef<number>();

  // Handle progress updates from realtime subscription
  const handleProgressUpdate = useCallback((data: { 
    progress: number, 
    processed_characters?: number | null,
    total_characters?: number | null 
  }) => {
    console.log('Progress update received:', data);
    const { progress, processed_characters, total_characters } = data;

    if (typeof progress === 'number' && progress >= 0) {
      setRealProgress(prev => Math.max(prev, progress));
    }

    if (typeof processed_characters === 'number') {
      setProcessedCharacters(prev => Math.max(prev, processed_characters));
    }

    if (typeof total_characters === 'number' && total_characters > 0) {
      setTotalCharacters(total_characters);
    }
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    let channel;
    
    if (conversionId && (status === 'converting' || status === 'processing')) {
      console.log('Setting up realtime updates for conversion:', conversionId);
      
      // Get initial state
      supabase
        .from('text_conversions')
        .select('progress, processed_characters, total_characters')
        .eq('id', conversionId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching initial state:', error);
            return;
          }
          
          if (data) {
            console.log('Initial state:', data);
            handleProgressUpdate(data);
          }
        });
      
      // Set up realtime channel
      channel = supabase
        .channel(`conversion-${conversionId}`)
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
              handleProgressUpdate(payload.new);
            }
          }
        )
        .subscribe((status) => {
          console.log(`Channel status (${conversionId}):`, status);
        });
    }

    return () => {
      if (channel) {
        console.log('Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [conversionId, status, handleProgressUpdate]);

  // Handle progress simulation and elapsed time
  useEffect(() => {
    if ((status === 'converting' || status === 'processing') && realProgress < 100) {
      // Update elapsed time
      const elapsedInterval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Update simulated progress
      simulationIntervalRef.current = window.setInterval(() => {
        setSimulatedProgress(prev => {
          const simulated = calculateSimulatedProgress(
            elapsedTime,
            totalCharacters,
            processedCharacters,
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

    // Clean up when completed
    if (status === 'completed' || realProgress >= 100) {
      setElapsedTime(0);
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    }
  }, [status, realProgress, elapsedTime, totalCharacters, processedCharacters]);

  // Calculate estimated time remaining
  const getEstimatedTimeRemaining = useCallback(() => {
    if (realProgress >= 100 || status === 'completed') {
      return null;
    }

    if (processedCharacters === 0 || totalCharacters === 0) {
      return 'Calculating...';
    }

    const averageTimePerChar = elapsedTime / processedCharacters;
    const remainingChars = totalCharacters - processedCharacters;
    const estimatedRemainingSeconds = Math.ceil(remainingChars * averageTimePerChar);

    return formatTimeRemaining(Math.max(estimatedRemainingSeconds, 5));
  }, [realProgress, status, processedCharacters, totalCharacters, elapsedTime]);

  const progress = Math.max(realProgress, simulatedProgress);

  return {
    progress,
    elapsedTime,
    timeRemaining: getEstimatedTimeRemaining(),
    hasStarted: progress > 0 || status === 'converting' || status === 'processing',
    processedCharacters,
    totalCharacters
  };
};
