
import { ConversionState } from '../types';

export const updateElapsedTimeAction = (
  set: (state: Partial<ConversionState>) => void,
  get: () => any
) => {
  // Create a persistent reference for debounce state that won't be reset between calls
  const debounceState = {
    lastUpdateTime: 0,
    lastElapsedTime: 0
  };
  
  const MIN_UPDATE_INTERVAL = 500; // msec
  
  const updateElapsedTime = (elapsedSeconds: number, startTime: number) => {
    const currentState = get();
    
    // No need to update if status is not converting or processing
    if (currentState.status !== 'converting' && currentState.status !== 'processing') {
      return;
    }
    
    // Debounce updates - only update if significant change or enough time passed
    const now = Date.now();
    const timeElapsed = now - debounceState.lastUpdateTime;
    const secondsDiff = Math.abs(elapsedSeconds - debounceState.lastElapsedTime);
    
    if (timeElapsed < MIN_UPDATE_INTERVAL && secondsDiff < 2) {
      return;
    }
    
    // Update tracking vars
    debounceState.lastUpdateTime = now;
    debounceState.lastElapsedTime = elapsedSeconds;
    
    // Calculate remaining time based on progress and elapsed time
    let timeRemaining: number | undefined = undefined;
    
    if (currentState.progress > 5 && elapsedSeconds > 5) {
      // Simple linear projection: if X% took Y seconds, 100% will take (Y / X) * 100
      const estimatedTotalSeconds = (elapsedSeconds / currentState.progress) * 100;
      timeRemaining = Math.max(1, estimatedTotalSeconds - elapsedSeconds);
    }
    
    // Batch update to minimize renders
    set({
      time: {
        elapsed: elapsedSeconds,
        startTime,
        remaining: timeRemaining
      }
    });
  };

  return { updateElapsedTime };
};
