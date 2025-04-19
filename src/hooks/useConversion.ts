
import { useState, useCallback } from 'react';
import { ConversionService } from '@/services/conversion/ConversionService';
import { LoggingService } from '@/services/logging/LoggingService';

export function useConversion() {
  const [status, setStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  const startConversion = useCallback(async (textHash: string, fileName?: string, userId?: string) => {
    try {
      setStatus('converting');
      setProgress(0);
      
      const conversionId = await ConversionService.createConversion(textHash, fileName, userId);
      
      await LoggingService.logEvent(
        'info',
        'conversion',
        { message: 'Conversion started', fileName },
        conversionId
      );
      
      return conversionId;
    } catch (error) {
      setStatus('error');
      throw error;
    }
  }, []);

  const updateProgress = useCallback(async (
    conversionId: string,
    newProgress: number,
    isComplete?: boolean
  ) => {
    try {
      const status = isComplete ? 'completed' : 'processing';
      await ConversionService.updateConversionStatus(conversionId, status, newProgress);
      setProgress(newProgress);
      
      if (isComplete) {
        setStatus('completed');
        await LoggingService.logEvent(
          'info',
          'conversion',
          { message: 'Conversion completed', progress: 100 },
          conversionId
        );
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, []);

  return {
    status,
    progress,
    startConversion,
    updateProgress,
    setStatus,
    setProgress
  };
}
