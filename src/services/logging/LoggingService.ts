
import { supabase } from "@/integrations/supabase/client";
import { LogLevel, EventType } from '@/utils/logging/types';

export class LoggingService {
  static async logEvent(
    level: LogLevel,
    eventType: EventType,
    details: Record<string, any>,
    entityId?: string
  ) {
    const { error } = await supabase
      .from('system_logs')
      .insert({
        event_type: eventType,
        entity_id: entityId,
        details: {
          ...details,
          log_level: level,
          timestamp: new Date().toISOString()
        },
        status: level
      });

    if (error) {
      console.error('Error logging event:', error);
    }
  }

  static async getRecentLogs(limit: number = 50) {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async logTermsAcceptance(
    fileName?: string,
    fileType?: string,
    userId?: string
  ) {
    try {
      const { error } = await supabase
        .from('user_consents')
        .insert({
          ip_address: 'anonymous',
          terms_accepted: true,
          privacy_accepted: true,
          user_id: userId,
          user_agent: navigator.userAgent,
          accepted_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging terms acceptance:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to log terms acceptance:', error);
      return false;
    }
  }
}
