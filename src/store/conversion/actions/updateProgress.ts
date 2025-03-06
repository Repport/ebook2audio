import { ConversionState } from '../types';
import { calculateTimeRemaining } from '../utils';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const updateProgressAction = (
  set: (state: Partial<ConversionState>) => void,
  get: () => any,
  LoggingService: any
) => {
  // Keep track of last update state to prevent redundant updates
  let lastUpdateHash = '';

  const updateProgress = (data: ChunkProgressData) => {
    // Get current state
    const state = get();
    
    // If status is completed or error, don't update progress to avoid loops
    if (state.status === 'completed' || state.status === 'error') {
      console.log('ConversionStore: Ignoring progress update, conversion already completed or failed');
      return;
    }
    
    // Log data for debugging
    console.log(`ConversionStore [RAW]: Progress update received:`, {
      rawData: JSON.stringify(data),
      currentStatus: state.status
    });
    
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
    
    // If no valid data and not an error, log but continue
    if (!hasValidChunksData && !hasValidCharData && !hasExplicitProgress && !data.error) {
      console.warn('ConversionStore: Received update with insufficient data:', data);
      
      // If no data but we have isCompleted, we can process the final event
      if (data.isCompleted !== true) {
        return; // Ignore updates with insufficient data
      }
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
    let progressSource = 'existing';
    
    // Priority 1: Explicit progress
    if (hasExplicitProgress) {
      newProgress = Math.min(99, data.progress);
      progressSource = 'explicit';
    } 
    // Priority 2: Calculation based on processed characters
    else if (hasValidCharData && updatedChunks.totalCharacters > 0) {
      const calculatedProgress = Math.round((updatedChunks.processedCharacters / updatedChunks.totalCharacters) * 100);
      newProgress = Math.min(99, calculatedProgress);
      progressSource = 'characters';
    }
    // Priority 3: Calculation based on processed chunks
    else if (hasValidChunksData && updatedChunks.total > 0) {
      const calculatedProgress = Math.round((updatedChunks.processed / updatedChunks.total) * 100);
      newProgress = Math.min(99, calculatedProgress);
      progressSource = 'chunks';
    }
    
    // Ensure progress always advances (never regresses)
    // Exception: if there's a large change (>10%), accept it (could be a correction)
    if (newProgress < state.progress && Math.abs(newProgress - state.progress) < 10 && !data.isCompleted) {
      console.log(`ConversionStore: Progress regression detected (${newProgress}% < ${state.progress}%), keeping current progress`);
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
    
    // Check for missing chunks if completing
    if (hasValidChunksData && 
        updatedChunks.processed < updatedChunks.total && 
        data.isCompleted === true) {
      const missingChunksWarning = `Se completaron solo ${updatedChunks.processed} de ${updatedChunks.total} fragmentos de texto. El audio puede estar incompleto.`;
      uniqueWarnings.add(missingChunksWarning);
    }
    
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
    
    // Generate a hash of the new state to detect changes
    const newStateHash = `${updateObject.status}-${updateObject.progress}-${updatedChunks.processed}/${updatedChunks.total}-${updatedChunks.processedCharacters}/${updatedChunks.totalCharacters}-${uniqueErrors.size}-${uniqueWarnings.size}`;
    
    // Skip update if nothing has changed
    if (newStateHash === lastUpdateHash) {
      console.log('ConversionStore: Skipping update as state has not changed');
      return;
    }
    
    lastUpdateHash = newStateHash;
    
    // Log update summary for verification
    console.log(`ConversionStore: Updating progress: ${finalProgress}% (source: ${progressSource})`, {
      oldProgress: state.progress,
      oldChunks: `${state.chunks.processed}/${state.chunks.total}`,
      newChunks: `${updateObject.chunks.processed}/${updateObject.chunks.total}`,
      oldChars: `${state.chunks.processedCharacters}/${state.chunks.totalCharacters}`,
      newChars: `${updateObject.chunks.processedCharacters}/${updateObject.chunks.totalCharacters}`,
      isComplete
    });
    
    // Apply the update with the validated new data
    set(updateObject);
    
    // Additional debugging logs for significant updates
    if (isComplete || progressSource === 'characters' || progressSource === 'chunks') {
      LoggingService.debug('conversion', {
        message: 'Actualización significativa del progreso de conversión',
        progress: finalProgress,
        source: progressSource,
        chunks: `${updateObject.chunks.processed}/${updateObject.chunks.total}`,
        chars: `${updateObject.chunks.processedCharacters}/${updateObject.chunks.totalCharacters}`
      });
    }
  };

  return { updateProgress };
};
