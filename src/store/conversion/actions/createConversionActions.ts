
import { ConversionState, ConversionActions } from '../types';
import { startConversionAction } from './startConversion';
import { updateProgressAction } from './updateProgress';
import { updateElapsedTimeAction } from './updateTime';
import { errorWarningActions } from './errorWarning';
import { completionResetActions } from './completionReset';
import { LoggingService } from '@/utils/loggingService';

export const createConversionActions = (
  set: (state: Partial<ConversionState>) => void,
  get: () => any
): ConversionActions => {
  // Get action creators
  const startConversion = startConversionAction(set, get, LoggingService);
  const { updateProgress } = updateProgressAction(set, get, LoggingService);
  const { updateElapsedTime } = updateElapsedTimeAction(set, get);
  const { setError, setWarning, clearErrors, clearWarnings } = errorWarningActions(set, get, LoggingService);
  const { completeConversion, resetConversion } = completionResetActions(set, get, LoggingService);

  // Return combined actions
  return {
    startConversion,
    updateProgress,
    updateElapsedTime,
    setError,
    setWarning,
    clearErrors,
    clearWarnings,
    completeConversion,
    resetConversion
  };
};
