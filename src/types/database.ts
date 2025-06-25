
export interface DatabaseLogEntry {
  id?: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  created_at?: string;
  context?: any;
  user_id?: string;
  session_id?: string;
}
