
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { DatabaseLogEntry } from '@/utils/logging/types';

export function useErrorLogs() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorLogs, setErrorLogs] = useState<DatabaseLogEntry[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const loadErrorLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: supabaseError } = await supabase
        .from('system_logs')
        .select('*')
        .eq('status', 'error')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (supabaseError) throw supabaseError;
      
      // Cast data to the correct type
      setErrorLogs(data as unknown as DatabaseLogEntry[]);
      setError(null);
    } catch (err) {
      console.error('Error loading error logs:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    errorLogs,
    isLoading,
    loadErrorLogs,
    error
  };
}
