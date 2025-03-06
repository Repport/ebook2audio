
import { ConversionState } from '../types';
import { calculateTimeRemaining } from '../utils';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const updateProgressAction = (
  set: (state: Partial<ConversionState>) => void,
  get: () => any,
  LoggingService: any
) => {
  const UPDATE_THROTTLE_MS = 200;
  let lastUpdateTime = 0;
  let lastProgressValue = 0;

  const updateProgress = (data: ChunkProgressData) => {
    // Apply throttling to reduce rendering frequency
    const now = Date.now();
    if (now - lastUpdateTime < UPDATE_THROTTLE_MS) {
      return;
    }
    
    // Get current state
    const state = get();
    
    // Skip updates if we're already in completed or error state
    if (state.status === 'completed' || state.status === 'error') {
      return;
    }

    // Validate required data fields
    if (!data || typeof data.progress !== 'number') {
      console.warn('ConversionStore: Invalid progress data:', data);
      return;
    }
    
    // Process errors and warnings
    const uniqueErrors = new Set<string>(state.errors);
    const uniqueWarnings = new Set<string>(state.warnings);
    
    if (data.error && typeof data.error === 'string' && data.error.trim() !== '') {
      uniqueErrors.add(data.error);
    }
    
    if (data.warning && typeof data.warning === 'string' && data.warning.trim() !== '') {
      uniqueWarnings.add(data.warning);
    }
    
    // Determine progress data
    const progressData = {
      processed: typeof data.processedChunks === 'number' ? data.processedChunks : state.chunks.processed,
      total: typeof data.totalChunks === 'number' ? data.totalChunks : state.chunks.total,
      processedChars: typeof data.processedCharacters === 'number' ? data.processedCharacters : state.chunks.processedCharacters,
      totalChars: typeof data.totalCharacters === 'number' ? data.totalCharacters : state.chunks.totalCharacters
    };
    
    // Calculate progress value
    let newProgress = data.progress;
    
    // Ensure progress never decreases (unless there's a significant correction)
    if (newProgress < lastProgressValue && Math.abs(newProgress - lastProgressValue) < 10) {
      newProgress = lastProgressValue;
    }
    
    // Cap at 99% until explicitly completed
    if (!data.isCompleted) {
      newProgress = Math.min(99, newProgress);
    }
    
    // Skip update if progress hasn't changed significantly
    if (Math.abs(newProgress - lastProgressValue) < 1 && 
        !data.error && !data.warning && !data.isCompleted) {
      return;
    }
    
    // Calculate time remaining if we have enough data
    let timeRemaining = state.time.remaining;
    
    if (!data.isCompleted && state.time.elapsed > 5 && newProgress > 5) {
      timeRemaining = calculateTimeRemaining(
        state.time.elapsed,
        newProgress,
        progressData.totalChars
      );
    }
    
    // Update state values
    lastUpdateTime = now;
    lastProgressValue = newProgress;
    
    // Build the state update
    const updateObject: Partial<ConversionState> = {
      status: data.isCompleted ? 'completed' : (data.error ? 'error' : 'converting'),
      progress: data.isCompleted ? 100 : newProgress,
      chunks: {
        processed: progressData.processed,
        total: progressData.total,
        processedCharacters: progressData.processedChars,
        totalCharacters: progressData.totalChars
      },
      time: {
        ...state.time,
        remaining: timeRemaining
      },
      errors: Array.from(uniqueErrors),
      warnings: Array.from(uniqueWarnings)
    };
    
    // Apply the update
    set(updateObject);
    
    console.log('Progress update:', {
      progress: newProgress, 
      chunks: `${progressData.processed}/${progressData.total}`,
      chars: `${progressData.processedChars}/${progressData.totalChars}`,
      status: updateObject.status
    });
  };

  return { updateProgress };
};
