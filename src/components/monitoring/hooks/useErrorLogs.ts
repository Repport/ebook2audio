
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { DatabaseLogEntry } from '@/utils/loggingService';

export function useErrorLogs() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorLogs, setErrorLogs] = useState<DatabaseLogEntry[]>([]);

  const loadErrorLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('status', 'error')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setErrorLogs(data || []);
    } catch (error) {
      console.error('Error loading error logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    errorLogs,
    isLoading,
    loadErrorLogs
  };
}
