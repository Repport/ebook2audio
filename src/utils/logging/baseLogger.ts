
import { supabase } from "@/integrations/supabase/client";
import { LogLevel, EventType, LogEntry } from './types';

/**
 * Core logging functionality for the application
 */
export const baseLogger = {
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
  }
};
