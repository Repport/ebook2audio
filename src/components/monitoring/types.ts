
// Import from the correct logging service
import { DatabaseLogEntry as SystemLogEntry } from '@/utils/loggingService';
import { PerformanceMetric, SystemStats } from './hooks/types';

// Local log interface that matches what the UI needs
export interface Log {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details: string;
}

// Database log interface
export interface DatabaseLog {
  id: string;
  created_at: string;
  event_type: string;
  details: Record<string, any>;
  status: string;
}

// Props for the system stats component
export interface SystemStatsProps {
  stats: SystemStats;
  isLoading: boolean;
  onRefresh: () => void;
}

// Props for performance metrics component
export interface PerformanceMetricsProps {
  metrics: PerformanceMetric[];
  isLoading: boolean;
  onRefresh: () => void;
}

// Monitoring data interface
export interface MonitoringData {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoading: boolean;
  stats: SystemStats;
  logs: SystemLogEntry[];
  errorLogs: SystemLogEntry[];
  performanceMetrics: PerformanceMetric[];
  loadStats: () => Promise<void>;
  loadLogs: () => Promise<void>;
  loadErrorLogs: () => Promise<void>;
  loadPerformanceMetrics: () => Promise<void>;
  clearLogs: () => Promise<void>;
}

// Props for log components
export interface LogsListProps {
  logs: SystemLogEntry[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export interface RecentLogsProps {
  logs: SystemLogEntry[];
  title?: string;
  limit?: number;
}

export interface ErrorLogsProps {
  logs: SystemLogEntry[];
}

// Export the SystemLogEntry type so it can be used in other modules
export type { SystemLogEntry };
