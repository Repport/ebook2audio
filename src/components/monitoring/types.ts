
import { DatabaseLogEntry } from '@/utils/loggingService';

export interface PerformanceMetric {
  operation: string;
  avg_duration_ms: number;
  max_duration_ms: number;
  min_duration_ms: number;
  count: number;
}

export interface SystemStats {
  totalConversions: number;
  completedConversions: number;
  cachedItems: number;
  avgProcessingTime: number;
}

export interface MonitoringData {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoading: boolean;
  stats: SystemStats;
  logs: DatabaseLogEntry[];
  errorLogs: DatabaseLogEntry[];
  performanceMetrics: PerformanceMetric[];
  loadStats: () => Promise<void>;
  loadLogs: () => Promise<void>;
  loadErrorLogs: () => Promise<void>;
  loadPerformanceMetrics: () => Promise<void>;
  clearLogs: () => Promise<void>;
}

export interface SystemStatsProps {
  stats: SystemStats;
  isLoading: boolean;
  onRefresh: () => void;
}

export interface PerformanceMetricsProps {
  metrics: PerformanceMetric[];
  isLoading: boolean;
  onRefresh: () => void;
}
