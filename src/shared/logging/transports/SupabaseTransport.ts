
import { LogTransport, LogEntry } from '../types';
import { supabase } from '@/integrations/supabase/client';

export class SupabaseTransport implements LogTransport {
  name = 'supabase';

  async write(entry: LogEntry): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_logs')
        .insert({
          event_type: entry.context,
          entity_id: entry.details?.conversionId || entry.details?.entityId,
          user_id: entry.userId,
          details: {
            ...entry.details,
            message: entry.message,
            level: entry.level,
            sessionId: entry.sessionId,
            timestamp: entry.timestamp.toISOString()
          },
          status: entry.level,
          created_at: entry.timestamp.toISOString()
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      // No usar el logger aquí para evitar recursión infinita
      console.error('SupabaseTransport error:', error);
    }
  }
}
