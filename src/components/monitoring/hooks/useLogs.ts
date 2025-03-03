
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { DatabaseLogEntry } from '@/utils/loggingService';

export function useLogs() {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<DatabaseLogEntry[]>([]);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearLogs = useCallback(async () => {
    if (!window.confirm('Are you sure you want to clear all logs?')) return;
    
    try {
      const { error } = await supabase
        .from('system_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to delete all
      
      if (error) throw error;
      
      loadLogs();
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }, [loadLogs]);

  return {
    logs,
    isLoading,
    loadLogs,
    clearLogs
  };
}
