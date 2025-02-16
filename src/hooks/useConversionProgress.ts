
import { useRef } from 'react';
import { useProgressState } from './conversion/useProgressState';
import { useTimeTracking } from './conversion/useTimeTracking';
import { useProgressUpdates } from './conversion/useProgressUpdates';
import { useTimeEstimation } from './conversion/useTimeEstimation';
import { useRealtimeSubscription } from './conversion/useRealtimeSubscription';
import { useBatchProgress } from './conversion/useBatchProgress';
import { useProgressSimulation } from './conversion/useProgressSimulation';
import { useBatchUpdates } from './conversion/useBatchUpdates';

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

  const handleProgressUpdate = useProgressUpdates(
    setProgress,
    setProcessedChunks,
    setTotalChunks,
    lastUpdateRef,
    Math.ceil(totalCharacters / 4800)
  );

  const timeRemaining = useTimeEstimation(
    progress,
    status,
    processedCharactersRef.current,
    elapsedTime,
    totalCharacters
  );

  const updateProgressInBatches = useBatchProgress(
    conversionId,
    processedCharactersRef,
    totalCharacters
  );

  useBatchUpdates(status, updateProgressInBatches);

  useProgressSimulation(
    status,
    progress,
    totalCharacters,
    processedChunks,
    setProgress,
    setElapsedTime,
    startTimeRef,
    lastUpdateRef,
    processedCharactersRef
  );

  useRealtimeSubscription(
    conversionId,
    status,
    (data) => {
      console.log('🔄 Realtime update received:', data);
      if (data.progress !== undefined) {
        setProgress(data.progress);
      }
      if (data.processed_characters !== undefined) {
        processedCharactersRef.current = data.processed_characters;
      }
      handleProgressUpdate(data);
      lastUpdateRef.current = Date.now();
    },
    Math.ceil(totalCharacters / 4800),
    textLength
  );

  return {
    progress,
    elapsedTime,
    timeRemaining,
    hasStarted: processedCharactersRef.current > 0 || status === 'converting' || status === 'processing',
    processedChunks,
    totalChunks: Math.ceil(totalCharacters / 4800)
  };
};
