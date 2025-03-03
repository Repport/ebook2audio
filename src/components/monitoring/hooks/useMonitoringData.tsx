
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { DatabaseLogEntry } from '@/utils/loggingService';

interface PerformanceMetric {
  operation: string;
  avg_duration_ms: number;
  max_duration_ms: number;
  min_duration_ms: number;
  count: number;
}

interface SystemStats {
  totalConversions: number;
  completedConversions: number;
  cachedItems: number;
  avgProcessingTime: number;
}

export function useMonitoringData() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    totalConversions: 0,
    completedConversions: 0,
    cachedItems: 0,
    avgProcessingTime: 0,
  });
  const [logs, setLogs] = useState<DatabaseLogEntry[]>([]);
  const [errorLogs, setErrorLogs] = useState<DatabaseLogEntry[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);

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

  const loadTabData = useCallback(() => {
    switch (activeTab) {
      case "overview":
        loadStats();
        loadLogs();
        break;
      case "logs":
        loadLogs();
        break;
      case "errors":
        loadErrorLogs();
        break;
      case "performance":
        loadPerformanceMetrics();
        break;
    }
  }, [activeTab, loadStats, loadLogs, loadErrorLogs, loadPerformanceMetrics]);

  useEffect(() => {
    loadTabData();
  }, [activeTab, loadTabData]);

  return {
    activeTab,
    setActiveTab,
    isLoading,
    stats,
    logs,
    errorLogs,
    performanceMetrics,
    loadStats,
    loadLogs,
    loadErrorLogs,
    loadPerformanceMetrics,
    clearLogs
  };
}
