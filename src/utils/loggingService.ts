import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

/**
 * Log level types for application events
 */
export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

/**
 * Application event types for categorizing logs
 */
export type EventType = 
  | 'conversion' 
  | 'conversion_status_change'
  | 'cache'
  | 'storage'
  | 'auth'
  | 'notification'
  | 'maintenance'
  | 'user_action'
  | 'performance'
  | 'api_call';

/**
 * Structured log entry interface
 */
export interface LogEntry {
  id?: string;
  event_type: EventType;
  entity_id?: string | null;
  user_id?: string | null;
  details: Record<string, any>;
  status?: string | null;
  ip_address?: string | null;
  created_at?: string | null;
}

/**
 * Details that might exist in a log entry
 */
export interface LogDetails {
  message?: string;
  log_level?: LogLevel;
  error?: string | null;
  error_message?: string | null;
  path?: string | null;
  timestamp?: string | null;
  operation?: string | null;
  duration_ms?: number | null;
  [key: string]: any; // Allow other properties
}

/**
 * Database log entry with extended properties from the table
 */
export interface DatabaseLogEntry {
  id: string;
  event_type: string;
  entity_id: string | null;
  user_id: string | null;
  details: Json | null;
  status: string | null;
  ip_address: string | null;
  created_at: string | null;
  metadata?: Json | null;
}

/**
 * Helper functions for working with log entries
 */
export const LogEntryUtils = {
  /**
   * Safely get a message from a log entry
   */
  getMessage: (log: DatabaseLogEntry): string => {
    if (!log.details) return '';
    
    const details = log.details as Record<string, any>;
    return details.message || details.msg || details.error_message || 
           details.error || details.event_message || 
           JSON.stringify(details).substring(0, 100);
  },
  
  /**
   * Get a formatted timestamp from a log entry
   */
  getTimestamp: (log: DatabaseLogEntry): string => {
    if (log.created_at) {
      return new Date(log.created_at).toLocaleString();
    }
    
    if (log.details && typeof log.details === 'object') {
      const details = log.details as Record<string, any>;
      if (details.timestamp) {
        return new Date(details.timestamp).toLocaleString();
      }
    }
    
    return 'Unknown time';
  },
  
  /**
   * Get log level from a log entry
   */
  getLogLevel: (log: DatabaseLogEntry): LogLevel => {
    if (log.status === 'error') return 'error';
    
    if (log.details && typeof log.details === 'object') {
      const details = log.details as Record<string, any>;
      return (details.log_level as LogLevel) || 'info';
    }
    
    return 'info';
  },
  
  /**
   * Get error details from a log entry
   */
  getError: (log: DatabaseLogEntry): string | null => {
    if (!log.details) return null;
    
    const details = log.details as Record<string, any>;
    return details.error || details.error_message || null;
  },
  
  /**
   * Get path information from a log entry
   */
  getPath: (log: DatabaseLogEntry): string | null => {
    if (!log.details) return null;
    
    const details = log.details as Record<string, any>;
    return details.path || null;
  }
};

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
    const { entityId, userId, status, ipAddress } = options || {};
    
    // Create log entry for database
    const logEntry: LogEntry = {
      event_type: eventType,
      entity_id: entityId || null,
      user_id: userId || null,
      details: {
        ...details,
        log_level: level,
        timestamp: new Date().toISOString(),
      },
      status: status || level,
      ip_address: ipAddress || null,
    };
    
    // Console logging with consistent format and colors
    const consolePrefix = `[${new Date().toLocaleTimeString()}] ${eventType.toUpperCase()}:`;
    
    switch (level) {
      case 'error':
        console.error(
          consolePrefix, 
          entityId ? `[ID: ${entityId.substring(0, 8)}...]` : '', 
          details.message || details
        );
        break;
      case 'warning':
        console.warn(
          consolePrefix, 
          entityId ? `[ID: ${entityId.substring(0, 8)}...]` : '', 
          details.message || details
        );
        break;
      case 'debug':
        console.debug(
          consolePrefix, 
          entityId ? `[ID: ${entityId.substring(0, 8)}...]` : '', 
          details.message || details
        );
        break;
      case 'info':
      default:
        console.log(
          consolePrefix, 
          entityId ? `[ID: ${entityId.substring(0, 8)}...]` : '', 
          details.message || details
        );
    }
    
    // Don't log to database in development mode if specified
    if (details.devOnly === true && import.meta.env.DEV) {
      return;
    }
    
    // Write to system_logs table
    try {
      const { error } = await supabase.from('system_logs').insert(logEntry);
      
      if (error) {
        console.error('Failed to write to system_logs:', error);
      }
    } catch (err) {
      console.error('Exception writing to system_logs:', err);
    }
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
    return LoggingService.log('info', eventType, details, options);
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
    return LoggingService.log('warning', eventType, details, options);
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
    return LoggingService.log('error', eventType, details, options);
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
    return LoggingService.log('debug', eventType, details, options);
  },
  
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
    return LoggingService.log(
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
        
        await LoggingService.logPerformance(
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
