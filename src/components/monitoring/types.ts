
// Import from the correct logging service
import { DatabaseLogEntry } from '@/utils/logging/types';
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
  logs: DatabaseLogEntry[];
  errorLogs: DatabaseLogEntry[];
  performanceMetrics: PerformanceMetric[];
  loadStats: () => Promise<void>;
  loadLogs: () => Promise<void>;
  loadErrorLogs: () => Promise<void>;
  loadPerformanceMetrics: () => Promise<void>;
  clearLogs: () => Promise<void>;
}

// Props for log components
export interface LogsListProps {
  logs: DatabaseLogEntry[];
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
}

export interface RecentLogsProps {
  logs?: DatabaseLogEntry[];
  title?: string;
  limit?: number;
  isLoading?: boolean;
  error?: Error | null;
}

export interface ErrorLogsProps {
  logs?: DatabaseLogEntry[];
  isLoading?: boolean;
  error?: Error | null;
}

// Export the DatabaseLogEntry type so it can be used in other modules
export type { DatabaseLogEntry };
