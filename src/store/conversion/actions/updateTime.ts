
import { ConversionState } from '../types';

export const updateElapsedTimeAction = (
  set: (state: Partial<ConversionState>) => void,
  get: () => any
) => {
  const updateElapsedTime = (elapsed: number, startTime: number) => {
    const state = get();
    // Only update if the time has actually changed AND status is converting/processing to avoid unnecessary renders
    if (state.time.elapsed !== elapsed && 
        (state.status === 'converting' || state.status === 'processing')) {
      console.log(`ConversionStore: Updating elapsed time: ${elapsed}s`);
      set({
        time: {
          ...state.time,
          elapsed,
          startTime
        }
      });
    }
  };

  return { updateElapsedTime };
};
