
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

export interface LogsComponentProps {
  logs: DatabaseLogEntry[];
  isLoading: boolean;
  onRefresh: () => void;
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

export interface RecentLogsProps extends LogsComponentProps {
  onClearLogs: () => void;
}
