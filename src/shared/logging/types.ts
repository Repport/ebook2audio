
// Tipos específicos para el sistema de logging
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type LogContext = 'conversion' | 'storage' | 'auth' | 'performance' | 'system' | 'user';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  context: LogContext;
  message: string;
  details?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  formatters: LogFormatter[];
  transports: LogTransport[];
}

export interface LogFormatter {
  format(entry: LogEntry): string;
}

export interface LogTransport {
  name: string;
  write(entry: LogEntry): Promise<void>;
}
