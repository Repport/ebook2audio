
import { useRef, useEffect } from 'react';
import { useProgressState } from './conversion/useProgressState';
import { useTimeTracking } from './conversion/useTimeTracking';
import { useProgressUpdates } from './conversion/useProgressUpdates';
import { useTimeEstimation } from './conversion/useTimeEstimation';
import { useRealtimeSubscription } from './conversion/useRealtimeSubscription';
import { useBatchProgress } from './conversion/useBatchProgress';
import { useProgressSimulation } from './conversion/useProgressSimulation';
import { useBatchUpdates } from './conversion/useBatchUpdates';
import { getProgress, updateProgress as updateCacheProgress, initializeProgress } from '../services/conversion/progressCache';

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialProgress: number,
  estimatedSeconds: number,
  conversionId?: string | null,
  textLength?: number
) => {
  const {
    progress,
    setProgress,
    elapsedTime,
    setElapsedTime,
    processedChunks,
    setProcessedChunks,
    totalChunks,
    setTotalChunks
  } = useProgressState(initialProgress);

  const { startTimeRef, lastUpdateRef } = useTimeTracking();
  const processedCharactersRef = useRef<number>(0);
  const totalCharacters = textLength || 0;
  const lastProgressRef = useRef<ReturnType<typeof updateCacheProgress> | null>(null);

  // Inicializar el progreso cuando comienza la conversión
  useEffect(() => {
    if ((status === 'converting' || status === 'processing') && conversionId && totalCharacters > 0) {
      console.log('🏁 Initializing progress tracking for:', conversionId);
      initializeProgress(conversionId, totalCharacters);
    }
  }, [status, conversionId, totalCharacters]);

  const handleProgressUpdate = (data: any) => {
    if (!conversionId) return;

    console.log('📊 Progress update received:', data);

    const updatedProgress = updateCacheProgress(conversionId, data.processed_characters || 0);
    if (updatedProgress) {
      console.log('📈 Updated progress:', updatedProgress);
      setProgress(updatedProgress.progress);
      setElapsedTime(updatedProgress.elapsedSeconds);
      processedCharactersRef.current = updatedProgress.processedCharacters;
      lastProgressRef.current = updatedProgress;
    }
  };

  useRealtimeSubscription(
    conversionId,
    status,
    handleProgressUpdate,
    Math.ceil(totalCharacters / 4800),
    textLength
  );

  return {
    progress,
    elapsedTime,
    timeRemaining: lastProgressRef.current?.estimatedSeconds || null,
    hasStarted: processedCharactersRef.current > 0 || status === 'converting' || status === 'processing',
    processedChunks,
    totalChunks: Math.ceil(totalCharacters / 4800),
    speed: getProgress(conversionId || '')?.speed || 0
  };
};
