
import { useState, useCallback } from 'react';
import { ConversionRequest, ConversionResult, ProcessingProgress } from '@/core/types';
import { logger } from '@/shared/logging';
import { performanceTracker } from '@/shared/utils/performance';
import { ConversionService } from '../services/ConversionService';

export interface UseConversionProcessReturn {
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: ProcessingProgress | null;
  result: ConversionResult | null;
  error: Error | null;
  startConversion: (request: ConversionRequest) => Promise<void>;
  resetConversion: () => void;
}

export const useConversionProcess = (): UseConversionProcessReturn => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const startConversion = useCallback(async (request: ConversionRequest) => {
    try {
      setStatus('processing');
      setError(null);
      setResult(null);
      setProgress(null);

      logger.conversion.started(request.id, {
        textLength: request.text.length,
        voiceId: request.voiceId,
        fileName: request.fileName,
        options: request.options
      });

      const conversionResult = await performanceTracker.measure(
        `conversion-${request.id}`,
        () => ConversionService.convert(request, (progressUpdate) => {
          setProgress(progressUpdate);
          logger.conversion.progress(request.id, progressUpdate.progress, {
            processedChunks: progressUpdate.processedChunks,
            totalChunks: progressUpdate.totalChunks
          });
        }),
        { conversionId: request.id }
      );

      setResult(conversionResult);
      setStatus('completed');
      
      logger.conversion.completed(request.id, {
        audioSize: conversionResult.audio.byteLength,
        duration: conversionResult.duration,
        metadata: conversionResult.metadata
      });

    } catch (err) {
      const conversionError = err instanceof Error ? err : new Error('Unknown conversion error');
      setError(conversionError);
      setStatus('error');
      
      logger.conversion.failed(request.id, conversionError, {
        textLength: request.text.length,
        voiceId: request.voiceId
      });
    }
  }, []);

  const resetConversion = useCallback(() => {
    setStatus('idle');
    setProgress(null);
    setResult(null);
    setError(null);
    logger.info('conversion', 'Conversion state reset');
  }, []);

  return {
    status,
    progress,
    result,
    error,
    startConversion,
    resetConversion
  };
};
