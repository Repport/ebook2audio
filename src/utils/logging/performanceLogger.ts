
import { LogLevel, EventType } from './types';
import { baseLogger } from './baseLogger';

/**
 * Specialized logging functions for performance monitoring
 */
export const PerformanceLogger = {
  /**
   * Log performance metrics
   */
  logPerformance: async (
    operation: string,
    durationMs: number,
    additionalDetails?: Record<string, any>,
    options?: {
      entityId?: string;
      userId?: string;
    }
  ): Promise<void> => {
    return baseLogger.log(
      'info', 
      'performance', 
      {
        operation,
        duration_ms: durationMs,
        ...additionalDetails
      },
      {
        ...options,
        status: durationMs > 1000 ? 'slow' : 'normal'
      }
    );
  },
  
  /**
   * Create a performance timer that logs when stopped
   */
  startPerformanceTimer: (
    operation: string,
    options?: {
      entityId?: string;
      userId?: string;
      additionalDetails?: Record<string, any>;
    }
  ) => {
    const startTime = performance.now();
    
    return {
      stop: async () => {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        await PerformanceLogger.logPerformance(
          operation,
          duration,
          options?.additionalDetails,
          {
            entityId: options?.entityId,
            userId: options?.userId
          }
        );
        
        return duration;
      }
    };
  }
};
