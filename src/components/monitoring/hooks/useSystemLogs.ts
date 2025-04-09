
import { DatabaseLogEntry } from '@/utils/logging/types';

export function useSystemLogs() {
  /**
   * Extract the log level from a database log entry
   */
  const getLogLevel = (log: DatabaseLogEntry): 'info' | 'warn' | 'error' | 'debug' => {
    // If status is directly available, use it
    if (log.status === 'error') return 'error';
    
    // Check event_type which might contain level information
    if (log.event_type?.includes('error')) return 'error';
    if (log.event_type?.includes('warn')) return 'warn';
    if (log.event_type?.includes('debug')) return 'debug';
    
    // Check details if it has a level property
    if (log.details && typeof log.details === 'object') {
      if ('level' in log.details) {
        const level = log.details.level;
        if (typeof level === 'string') {
          if (['error', 'warn', 'debug', 'info'].includes(level)) {
            return level as 'info' | 'warn' | 'error' | 'debug';
          }
        }
      }
      
      // Check severity as an alternative
      if ('severity' in log.details) {
        const severity = log.details.severity;
        if (typeof severity === 'string') {
          if (severity.includes('error')) return 'error';
          if (severity.includes('warn')) return 'warn';
          if (severity.includes('debug')) return 'debug';
        }
      }
    }
    
    // Default to info
    return 'info';
  };
  
  /**
   * Extract the timestamp from a database log entry and format it
   */
  const getLogTimestamp = (log: DatabaseLogEntry): string => {
    // Use created_at which is common in database records
    if (log.created_at) {
      try {
        const date = new Date(log.created_at);
        return date.toLocaleString();
      } catch (e) {
        // If date parsing fails, return raw timestamp
        return log.created_at;
      }
    }
    
    // Look for timestamp in details
    if (log.details && typeof log.details === 'object') {
      if ('timestamp' in log.details) {
        return log.details.timestamp as string;
      }
      if ('time' in log.details) {
        return log.details.time as string;
      }
    }
    
    // If no timestamp is found
    return 'Unknown time';
  };
  
  /**
   * Extract the message from a database log entry
   */
  const getLogMessage = (log: DatabaseLogEntry): string => {
    // If there's a direct message property
    if ('message' in log && typeof log.message === 'string') {
      return log.message;
    }
    
    // Try to find message in details
    if (log.details && typeof log.details === 'object') {
      if ('message' in log.details && typeof log.details.message === 'string') {
        return log.details.message;
      }
      
      if ('error' in log.details && typeof log.details.error === 'string') {
        return log.details.error;
      }
      
      // If details has a description, use that
      if ('description' in log.details && typeof log.details.description === 'string') {
        return log.details.description;
      }
    }
    
    // Fallback to event_type
    if (log.event_type) {
      return `${log.event_type} event`;
    }
    
    // Last resort
    return 'No message available';
  };
  
  return {
    getLogLevel,
    getLogTimestamp,
    getLogMessage
  };
}
