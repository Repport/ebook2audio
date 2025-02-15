
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

  // Handle progress updates from realtime subscription
  const handleProgressUpdate = useCallback((data: { 
    progress: number, 
    processed_chunks?: number | null,
    total_chunks?: number | null 
  }) => {
    const currentTime = Date.now();
    console.log('Progress update received:', {
      ...data,
      timeSinceLastUpdate: currentTime - lastUpdateRef.current
    });
    
    const { progress: newProgress, processed_chunks, total_chunks } = data;
    lastUpdateRef.current = currentTime;

    if (typeof newProgress === 'number' && !isNaN(newProgress) && newProgress >= 0) {
      setProgress(prevProgress => Math.max(newProgress, prevProgress));
    }

    if (typeof processed_chunks === 'number' && !isNaN(processed_chunks)) {
      setProcessedChunks(processed_chunks);
      console.log('Updated processed chunks:', processed_chunks);
    }

    if (typeof total_chunks === 'number' && !isNaN(total_chunks) && total_chunks > 0) {
      setTotalChunks(total_chunks);
      console.log('Updated total chunks:', total_chunks);
    }
  }, []);

  // Set up realtime subscription with improved error handling
  useEffect(() => {
    let channel;
    
    if (conversionId && (status === 'converting' || status === 'processing')) {
      console.log('Setting up realtime updates for conversion:', conversionId);
      
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
      
      // Set up realtime channel with specific event types
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
  }, [conversionId, status, handleProgressUpdate]);

  // Update elapsed time and simulate progress when needed
  useEffect(() => {
    let interval: number | undefined;

    if ((status === 'converting' || status === 'processing') && progress < 100) {
      interval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
        
        const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
        
        // If we haven't received an update in 5 seconds, use simulated progress
        if (timeSinceLastUpdate > 5000 && progress < 90) {
          const simulatedProgress = calculateSimulatedProgress(
            elapsed,
            totalChunks,
            processedChunks,
            progress
          );
          setProgress(prev => Math.max(prev, simulatedProgress));
        }
      }, 1000);
    } else if (status === 'completed' || progress >= 100) {
      setProgress(100);
      setElapsedTime(prev => prev); // Keep final elapsed time
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, progress, totalChunks, processedChunks]);

  // Calculate estimated time remaining with improved accuracy
  const getEstimatedTimeRemaining = useCallback(() => {
    if (progress >= 100 || status === 'completed') {
      return null;
    }

    if (processedChunks === 0 || totalChunks === 0) {
      return 'Calculating...';
    }

    const remainingChunks = totalChunks - processedChunks;
    const avgTimePerChunk = elapsedTime / processedChunks;
    const estimatedRemainingSeconds = Math.ceil(remainingChunks * avgTimePerChunk);
    
    console.log('Time estimation:', {
      remainingChunks,
      avgTimePerChunk,
      estimatedRemainingSeconds,
      elapsedTime,
      processedChunks,
      totalChunks,
      currentProgress: progress
    });

    return formatTimeRemaining(Math.max(estimatedRemainingSeconds, 5));
  }, [progress, status, totalChunks, processedChunks, elapsedTime]);

  return {
    progress,
    elapsedTime,
    timeRemaining: getEstimatedTimeRemaining(),
    hasStarted: progress > 0 || status === 'converting' || status === 'processing',
    processedChunks,
    totalChunks
  };
};
