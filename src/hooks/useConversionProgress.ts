
import { useState, useEffect, useCallback, useRef } from 'react';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import { supabase } from '@/integrations/supabase/client';

const AVERAGE_CHUNK_PROCESSING_TIME = 10; // seconds per chunk
const AUDIO_COMPOSITION_TIME = 15; // seconds for final composition

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

  // Handle progress updates from realtime subscription
  const handleProgressUpdate = useCallback((data: { 
    progress: number, 
    processed_chunks?: number | null,
    total_chunks?: number | null 
  }) => {
    console.log('Progress update received:', data);
    const { progress: newProgress, processed_chunks, total_chunks } = data;

    if (typeof newProgress === 'number' && newProgress >= 0) {
      setProgress(Math.max(newProgress, 0));
    }

    if (typeof processed_chunks === 'number') {
      setProcessedChunks(processed_chunks);
    }

    if (typeof total_chunks === 'number' && total_chunks > 0) {
      setTotalChunks(total_chunks);
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
        .select('progress, processed_chunks, total_chunks')
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

  // Update elapsed time
  useEffect(() => {
    let interval: number | undefined;

    if ((status === 'converting' || status === 'processing') && progress < 100) {
      interval = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else if (status === 'completed' || progress >= 100) {
      setElapsedTime(prev => prev); // Keep final elapsed time
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, progress]);

  // Calculate estimated time remaining based on chunks
  const getEstimatedTimeRemaining = useCallback(() => {
    if (progress >= 100 || status === 'completed') {
      return null;
    }

    if (progress === 0 || totalChunks === 0) {
      return 'Calculating...';
    }

    // Calculate remaining time based on chunks and composition
    const remainingChunks = totalChunks - processedChunks;
    const estimatedChunkTime = remainingChunks * AVERAGE_CHUNK_PROCESSING_TIME;
    
    // Add composition time if we haven't reached that stage yet
    const compositionTimeRemaining = progress < 90 ? AUDIO_COMPOSITION_TIME : 0;
    
    const totalRemainingSeconds = estimatedChunkTime + compositionTimeRemaining;
    
    return formatTimeRemaining(Math.max(totalRemainingSeconds, 5));
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
