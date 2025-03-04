
import { ConversionState, ConversionActions } from '../types';
import { initialState } from '../initialState';
import { startConversionAction } from './startConversion';
import { updateProgressAction } from './updateProgress';
import { updateElapsedTimeAction } from './updateTime';
import { errorWarningActions } from './errorWarning';
import { completionResetActions } from './completionReset';
import { LoggingService } from '@/utils/loggingService';

export const createConversionActions = (
  set: (state: Partial<ConversionState>) => void,
  get: () => any // Using any here to avoid circular reference issues
): ConversionActions => {
  // Get the individual action creators and combine them
  const startConversion = startConversionAction(set, get, LoggingService);
  const { updateProgress } = updateProgressAction(set, get, LoggingService);
  const { updateElapsedTime } = updateElapsedTimeAction(set, get);
  const { setError, setWarning } = errorWarningActions(set, get, LoggingService);
  const { completeConversion, resetConversion } = completionResetActions(set, get, LoggingService);

  // Return the combined actions
  return {
    startConversion,
    updateProgress,
    updateElapsedTime,
    setError,
    setWarning,
    completeConversion,
    resetConversion
  };
};
