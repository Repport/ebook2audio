
import { useState, useEffect, useCallback, useRef } from 'react';
import { useStats } from './useStats';
import { useLogs } from './useLogs';
import { useErrorLogs } from './useErrorLogs';
import { usePerformanceMetrics } from './usePerformanceMetrics';
import { MonitoringData } from '../types';
import { DatabaseLogEntry } from '@/utils/logging/types';

export function useMonitoringData(): MonitoringData {
  const [activeTab, setActiveTab] = useState("overview");
  const isInitialMount = useRef(true);
  const previousTabRef = useRef(activeTab);
  
  const { stats, isLoading: statsLoading, loadStats } = useStats();
  const { logs, isLoading: logsLoading, loadLogs, clearLogs } = useLogs();
  const { errorLogs, isLoading: errorLogsLoading, loadErrorLogs } = useErrorLogs();
  const { performanceMetrics, isLoading: metricsLoading, loadPerformanceMetrics } = usePerformanceMetrics();

  // Combine loading states
  const isLoading = statsLoading || logsLoading || errorLogsLoading || metricsLoading;

  // Use useCallback to prevent function recreation on every render
  const loadTabData = useCallback(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Skip if tab hasn't actually changed
    if (activeTab === previousTabRef.current) {
      return;
    }
    
    // Update the reference to current tab
    previousTabRef.current = activeTab;
    
    // Only load data for the active tab
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

  // Only load data when the tab changes, not on every render
  useEffect(() => {
    loadTabData();
  }, [activeTab, loadTabData]);

  // Safely cast logs to the correct type
  const typedLogs = (logs || []) as DatabaseLogEntry[];
  const typedErrorLogs = (errorLogs || []) as DatabaseLogEntry[];

  return {
    activeTab,
    setActiveTab,
    isLoading,
    stats,
    logs: typedLogs,
    errorLogs: typedErrorLogs,
    performanceMetrics,
    loadStats,
    loadLogs,
    loadErrorLogs,
    loadPerformanceMetrics,
    clearLogs
  };
}
