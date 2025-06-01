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
 * Database log entry with extended properties from the table
 */
export interface DatabaseLogEntry {
  id: string;
  created_at: string;
  status?: string;
  event_type?: string;
  message?: string;
  details?: Record<string, any>; // Changed from Json to Record<string, any> for broader compatibility if needed, or keep Json if strict.
                               // The original was Record<string, any> in LogEntry, details?: Record<string, any> in DatabaseLogEntry.
                               // Sticking to Record<string, any> to match the original DatabaseLogEntry.
  entity_id?: string;
  entity_type?: string;
  user_id?: string;
}
