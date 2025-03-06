import { ConversionState } from '../types';
import { calculateTimeRemaining } from '../utils';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const updateProgressAction = (
  set: (state: Partial<ConversionState>) => void,
  get: () => any,
  LoggingService: any
) => {
  // Keep track of last update state to prevent redundant updates
  const updateState = {
    lastUpdateHash: '',
    lastUpdateTime: 0,
  };
  const UPDATE_THROTTLE_MS = 100; // Minimum time between updates

  const updateProgress = (data: ChunkProgressData) => {
    // Throttle updates to prevent excessive renders
    const now = Date.now();
    if (now - updateState.lastUpdateTime < UPDATE_THROTTLE_MS) {
      return;
    }
    
    // Get current state
    const state = get();
    
    // If status is completed or error, don't update progress to avoid loops
    if (state.status === 'completed' || state.status === 'error') {
      return;
    }

    // Validate critical fields to prevent errors with undefined values
    if (!data || (typeof data.progress !== 'number' && 
                 !data.processedChunks && 
                 !data.processedCharacters && 
                 !data.error && 
                 !data.warning && 
                 !data.isCompleted)) {
      console.warn('ConversionStore: Ignoring invalid progress update:', data);
      return;
    }
    
    // Create new sets to avoid modifying existing state arrays
    const uniqueErrors = new Set<string>(state.errors);
    const uniqueWarnings = new Set<string>(state.warnings);
    
    // Handle errors and warnings
    if (data.error && typeof data.error === 'string' && data.error.trim() !== '') {
      uniqueErrors.add(data.error);
    }
    
    if (data.warning && typeof data.warning === 'string' && data.warning.trim() !== '') {
      uniqueWarnings.add(data.warning);
    }
    
    // Critical validations: check that we have all necessary data
    const hasValidChunksData = typeof data.processedChunks === 'number' && 
                              typeof data.totalChunks === 'number' && 
                              data.totalChunks > 0;
                              
    const hasValidCharData = typeof data.processedCharacters === 'number' && 
                            typeof data.totalCharacters === 'number' && 
                            data.totalCharacters > 0;
    
    const hasExplicitProgress = typeof data.progress === 'number' && 
                               !isNaN(data.progress) && 
                               data.progress >= 0;
    
    // If no valid data and not an error or completion flag, exit early
    if (!hasValidChunksData && !hasValidCharData && !hasExplicitProgress && 
        !data.error && !data.isCompleted) {
      return;
    }
    
    // Data resolution: prioritize new data, but keep existing if no new data
    
    // 1. Chunk data
    const updatedChunks = {
      processed: hasValidChunksData ? data.processedChunks : state.chunks.processed,
      total: hasValidChunksData ? data.totalChunks : state.chunks.total,
      processedCharacters: hasValidCharData ? data.processedCharacters : state.chunks.processedCharacters,
      totalCharacters: hasValidCharData ? data.totalCharacters : state.chunks.totalCharacters
    };
    
    // 2. Calculate progress - use the most reliable strategy available
    let newProgress = state.progress;
    
    // Priority 1: Explicit progress
    if (hasExplicitProgress) {
      newProgress = Math.min(99, data.progress);
    } 
    // Priority 2: Calculation based on processed characters
    else if (hasValidCharData && updatedChunks.totalCharacters > 0) {
      const calculatedProgress = Math.round((updatedChunks.processedCharacters / updatedChunks.totalCharacters) * 100);
      newProgress = Math.min(99, calculatedProgress);
    }
    // Priority 3: Calculation based on processed chunks
    else if (hasValidChunksData && updatedChunks.total > 0) {
      const calculatedProgress = Math.round((updatedChunks.processed / updatedChunks.total) * 100);
      newProgress = Math.min(99, calculatedProgress);
    }
    
    // Ensure progress always advances (never regresses)
    // Exception: if there's a large change (>10%), accept it (could be a correction)
    if (newProgress < state.progress && Math.abs(newProgress - state.progress) < 10 && !data.isCompleted) {
      newProgress = state.progress;
    }
    
    // Check if conversion is complete
    const isComplete = data.isCompleted === true || newProgress >= 100;
    const finalProgress = isComplete ? 100 : newProgress;
    
    // Calculate remaining time if not completed
    let timeRemaining = state.time.remaining;
    
    if (!isComplete && state.time.elapsed > 5 && newProgress > 5) {
      timeRemaining = calculateTimeRemaining(
        state.time.elapsed,
        newProgress,
        updatedChunks.totalCharacters || 0
      );
    }
    
    // Generate a hash of the new state to detect changes
    const newStateHash = `${isComplete ? 'completed' : 'converting'}-${finalProgress}-${updatedChunks.processed}/${updatedChunks.total}-${uniqueErrors.size}-${uniqueWarnings.size}`;
    
    // Skip update if nothing has changed
    if (newStateHash === updateState.lastUpdateHash) {
      return;
    }
    
    updateState.lastUpdateHash = newStateHash;
    updateState.lastUpdateTime = now;
    
    // Create a single update object to batch all changes
    const updateObject: Partial<ConversionState> = {
      status: isComplete ? 'completed' : 'converting',
      progress: finalProgress,
      chunks: updatedChunks,
      time: {
        ...state.time,
        remaining: timeRemaining
      },
      errors: Array.from(uniqueErrors),
      warnings: Array.from(uniqueWarnings)
    };
    
    // Apply the update
    set(updateObject);
  };

  return { updateProgress };
};
