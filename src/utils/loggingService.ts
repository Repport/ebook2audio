
import { baseLogger } from './logging/baseLogger';
import { PerformanceLogger } from './logging/performanceLogger';
import { LogEntryUtils } from './logging/logEntryUtils';
import { LogLevel, EventType, LogEntry, LogDetails, DatabaseLogEntry } from './logging/types';

/**
 * Centralized logging service for application monitoring
 */
export const LoggingService = {
  /**
   * Log an event to the system_logs table and console
   */
  log: async (
    level: LogLevel,
    eventType: EventType,
    details: Record<string, any>,
    options?: {
      entityId?: string;
      userId?: string;
      status?: string;
      ipAddress?: string;
    }
  ): Promise<void> => {
    return baseLogger.log(level, eventType, details, options);
  },
  
  /**
   * Log an info level event
   */
  info: async (
    eventType: EventType,
    details: Record<string, any>,
    options?: {
      entityId?: string;
      userId?: string;
      status?: string;
      ipAddress?: string;
    }
  ): Promise<void> => {
    return baseLogger.log('info', eventType, details, options);
  },
  
  /**
   * Log a warning level event
   */
  warn: async (
    eventType: EventType,
    details: Record<string, any>,
    options?: {
      entityId?: string;
      userId?: string;
      status?: string;
      ipAddress?: string;
    }
  ): Promise<void> => {
    return baseLogger.log('warning', eventType, details, options);
  },
  
  /**
   * Log an error level event
   */
  error: async (
    eventType: EventType,
    details: Record<string, any>,
    options?: {
      entityId?: string;
      userId?: string;
      status?: string;
      ipAddress?: string;
    }
  ): Promise<void> => {
    return baseLogger.log('error', eventType, details, options);
  },
  
  /**
   * Log a debug level event
   */
  debug: async (
    eventType: EventType,
    details: Record<string, any>,
    options?: {
      entityId?: string;
      userId?: string;
      status?: string;
      ipAddress?: string;
    }
  ): Promise<void> => {
    return baseLogger.log('debug', eventType, details, options);
  },
  
  /**
   * Log performance metrics
   */
  logPerformance: PerformanceLogger.logPerformance,
  
  /**
   * Create a performance timer that logs when stopped
   */
  startPerformanceTimer: PerformanceLogger.startPerformanceTimer
};

// Re-export utility functions and types
export { LogEntryUtils };
export type { LogLevel, EventType, LogEntry, LogDetails, DatabaseLogEntry };
