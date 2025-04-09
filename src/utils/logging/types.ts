
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
  created_at: string;
  status?: string;
  event_type?: string;
  message?: string;
  details?: Record<string, any>;
  entity_id?: string;
  entity_type?: string;
  user_id?: string;
}
