
import { ConversionState } from '../types';
import { LoggingService } from '@/utils/loggingService';

/**
 * Creates the action to start conversion process
 */
export const startConversionAction = (
  set: (state: Partial<ConversionState>) => void,
  get: () => ConversionState,
  logger: typeof LoggingService
) => {
  // Return the startConversion function directly
  return (fileName: string | null) => {
    logger.info('conversion', { message: 'Starting conversion', fileName });
    
    set({
      status: 'converting',
      progress: 0,
      chunks: {
        processed: 0,
        total: 0,
        processedCharacters: 0,
        totalCharacters: 0
      },
      time: {
        elapsed: 0,
        remaining: null,
        startTime: Date.now()
      },
      errors: [],
      warnings: [],
      fileName
    });
  };
};
