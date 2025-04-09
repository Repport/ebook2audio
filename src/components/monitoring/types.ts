
export interface Log {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details: string;
}

export interface DatabaseLog {
  id: string;
  created_at: string;
  event_type: string;
  details: Record<string, any>;
  status: string;
}

export interface DatabaseLogEntry {
  id: string;
  created_at: string;
  event_type: string;
  details: Record<string, any> | null;
  status: string;
}

export interface LogEntryUtils {
  getTimestamp: (log: DatabaseLogEntry) => string;
  getLevel: (log: DatabaseLogEntry) => 'info' | 'warn' | 'error' | 'debug';
  getMessage: (log: DatabaseLogEntry) => string;
  getDetails: (log: DatabaseLogEntry) => string;
}
