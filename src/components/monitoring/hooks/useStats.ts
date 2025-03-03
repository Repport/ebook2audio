
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { SystemStats } from './types';

export function useStats() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    totalConversions: 0,
    completedConversions: 0,
    cachedItems: 0,
    avgProcessingTime: 0,
  });

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: conversionsData, error: conversionsError } = await supabase
        .from('text_conversions')
        .select('status', { count: 'exact' });
      
      if (conversionsError) throw conversionsError;
      
      const { count: completedCount, error: completedError } = await supabase
        .from('text_conversions')
        .select('id', { count: 'exact' })
        .eq('status', 'completed');
      
      if (completedError) throw completedError;
      
      const { count: cachedCount, error: cachedError } = await supabase
        .from('text_conversions')
        .select('id', { count: 'exact' })
        .eq('is_cached', true);
      
      if (cachedError) throw cachedError;
      
      const { data: avgTimeData, error: avgTimeError } = await supabase
        .from('system_logs')
        .select('details')
        .eq('event_type', 'performance')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (avgTimeError) throw avgTimeError;
      
      let totalDuration = 0;
      let count = 0;
      
      avgTimeData?.forEach(log => {
        if (log.details && typeof log.details === 'object' && 'duration_ms' in log.details) {
          const durationMs = Number(log.details.duration_ms);
          if (!isNaN(durationMs)) {
            totalDuration += durationMs;
            count++;
          }
        }
      });
      
      const avgProcessingTime = count > 0 ? (totalDuration / count / 1000).toFixed(1) : 0;
      
      setStats({
        totalConversions: conversionsData?.length || 0,
        completedConversions: completedCount || 0,
        cachedItems: cachedCount || 0,
        avgProcessingTime: Number(avgProcessingTime),
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    stats,
    isLoading,
    loadStats
  };
}
