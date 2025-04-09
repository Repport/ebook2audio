
export interface SystemStats {
  totalConversions: number;
  completedConversions: number;
  cachedItems: number;
  avgProcessingTime: number;
}

export interface PerformanceMetric {
  operation: string;
  avg_duration_ms: number;
  max_duration_ms: number;
  min_duration_ms: number;
  count: number;
}

export type LogLevel = 'info' | 'error' | 'warning' | 'debug';
