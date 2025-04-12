
import { DatabaseLogEntry, LogLevel } from './types';

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
      // Map 'warn' to 'warning' if needed
      const logLevel = details.log_level as string;
      if (logLevel === 'warn') return 'warning';
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
