
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
