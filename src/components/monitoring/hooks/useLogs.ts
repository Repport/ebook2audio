
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { DatabaseLogEntry } from '@/utils/logging/types';

export function useLogs() {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<DatabaseLogEntry[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: supabaseError } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (supabaseError) throw supabaseError;
      
      setLogs(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading logs:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearLogs = useCallback(async () => {
    if (!window.confirm('Are you sure you want to clear all logs?')) return;
    
    try {
      const { error: supabaseError } = await supabase
        .from('system_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to delete all
      
      if (supabaseError) throw supabaseError;
      
      loadLogs();
    } catch (err) {
      console.error('Error clearing logs:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [loadLogs]);

  return {
    logs,
    isLoading,
    loadLogs,
    clearLogs,
    error
  };
}
