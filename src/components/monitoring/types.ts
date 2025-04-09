
import { Log, DatabaseLogEntry } from '@/utils/logging/types';
import { DatabaseLogEntry as SystemLogEntry } from '@/utils/loggingService';
import { PerformanceMetric, SystemStats } from './hooks/types';

export interface Log {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details: string;
}

export interface DatabaseLog {
  id: string;
  created_at: string;
  event_type: string;
  details: Record<string, any>;
  status: string;
}

export interface DatabaseLogEntry {
  id: string;
  created_at: string;
  event_type: string;
  details: Record<string, any> | null;
  status: string;
}

export interface LogEntryUtils {
  getTimestamp: (log: DatabaseLogEntry) => string;
  getLevel: (log: DatabaseLogEntry) => 'info' | 'warn' | 'error' | 'debug';
  getMessage: (log: DatabaseLogEntry) => string;
  getDetails: (log: DatabaseLogEntry) => string;
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
  logs: DatabaseLogEntry[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export interface RecentLogsProps {
  logs: DatabaseLogEntry[];
  title?: string;
  limit?: number;
}

export interface ErrorLogsProps {
  logs: DatabaseLogEntry[];
}
