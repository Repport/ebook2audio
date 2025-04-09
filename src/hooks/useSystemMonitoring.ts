
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Log, DatabaseLogEntry } from '@/components/monitoring/types';
import { adaptDatabaseLogToLog } from '@/components/monitoring/logs';

export const useSystemMonitoring = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('system_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
          
        if (error) {
          throw error;
        }
        
        // Convert database logs to application logs format
        const formattedLogs = (data as DatabaseLogEntry[]).map(adaptDatabaseLogToLog);
        setLogs(formattedLogs);
        
      } catch (err: any) {
        console.error('Error fetching system logs:', err);
        setError(err.message || 'Failed to fetch logs');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
    
    // Set up real-time subscription for new logs
    const subscription = supabase
      .channel('system_logs_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'system_logs' 
      }, (payload) => {
        const newLog = adaptDatabaseLogToLog(payload.new as DatabaseLogEntry);
        setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 100));
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return { logs, isLoading, error };
};
