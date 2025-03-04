
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

/**
 * Logs an event to the system_logs table
 */
export const logSystemEvent = async (
  eventType: string,
  entityId: string | null,
  details: any,
  status: string = 'info'
): Promise<void> => {
  try {
    await supabase.from('system_logs').insert({
      id: uuidv4(),
      event_type: eventType,
      entity_id: entityId,
      details,
      status
    });
  } catch (error) {
    console.error('Failed to log system event:', error);
  }
};

/**
 * Logs a conversion-related error
 */
export const logConversionError = async (
  conversionId: string,
  error: Error,
  operation: string = 'conversion_operation'
): Promise<void> => {
  try {
    await logSystemEvent(
      operation,
      conversionId,
      {
        error: error.message,
        stack: error.stack
      },
      'error'
    );
  } catch (err) {
    console.error('Failed to log conversion error:', err);
  }
};
