
export interface Log {
  id?: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  details?: string;
}

export interface SystemStat {
  id: string;
  name: string;
  value: string | number;
  change?: number;
  status?: 'positive' | 'negative' | 'neutral';
  icon?: string;
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  history: number[];
  status?: 'good' | 'warning' | 'critical';
}
