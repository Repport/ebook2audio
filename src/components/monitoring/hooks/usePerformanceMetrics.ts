
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { PerformanceMetric } from './types';

export function usePerformanceMetrics() {
  const [isLoading, setIsLoading] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);

  const loadPerformanceMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('event_type', 'performance')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      const metricsMap = new Map<string, {
        operation: string;
        total_duration_ms: number;
        max_duration_ms: number;
        min_duration_ms: number;
        count: number;
      }>();
      
      data?.forEach(log => {
        if (log.details && typeof log.details === 'object' && 'operation' in log.details && 'duration_ms' in log.details) {
          const operation = String(log.details.operation);
          const durationMs = Number(log.details.duration_ms);
          
          if (!isNaN(durationMs)) {
            if (!metricsMap.has(operation)) {
              metricsMap.set(operation, {
                operation,
                total_duration_ms: 0,
                max_duration_ms: 0,
                min_duration_ms: Number.MAX_VALUE,
                count: 0
              });
            }
            
            const metric = metricsMap.get(operation)!;
            metric.total_duration_ms += durationMs;
            metric.max_duration_ms = Math.max(metric.max_duration_ms, durationMs);
            metric.min_duration_ms = Math.min(metric.min_duration_ms, durationMs);
            metric.count += 1;
          }
        }
      });
      
      const metrics = Array.from(metricsMap.values()).map(metric => ({
        operation: metric.operation,
        avg_duration_ms: Math.round(metric.total_duration_ms / metric.count),
        max_duration_ms: metric.max_duration_ms,
        min_duration_ms: metric.min_duration_ms === Number.MAX_VALUE ? 0 : metric.min_duration_ms,
        count: metric.count
      }));
      
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Error loading performance metrics:', error);
      setPerformanceMetrics([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    performanceMetrics,
    isLoading,
    loadPerformanceMetrics
  };
}
