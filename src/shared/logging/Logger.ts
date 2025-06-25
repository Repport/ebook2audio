
import { LogEntry, LogLevel, LogContext, LoggerConfig, LogTransport } from './types';
import { ConsoleTransport } from './transports/ConsoleTransport';
import { SupabaseTransport } from './transports/SupabaseTransport';
import { DefaultFormatter } from './formatters/DefaultFormatter';

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private sessionId: string;

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.sessionId = crypto.randomUUID();
    this.config = {
      level: 'info',
      enableConsole: true,
      enableRemote: true,
      formatters: [new DefaultFormatter()],
      transports: [
        new ConsoleTransport(),
        new SupabaseTransport()
      ],
      ...config
    };
  }

  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance || config) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    const promises = this.config.transports.map(transport => 
      transport.write(entry).catch(error => 
        console.error(`Logger transport ${transport.name} failed:`, error)
      )
    );
    await Promise.allSettled(promises);
  }

  private createEntry(
    level: LogLevel,
    context: LogContext,
    message: string,
    details?: Record<string, any>,
    userId?: string
  ): LogEntry {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      context,
      message,
      details,
      userId,
      sessionId: this.sessionId,
      stack: level === 'error' || level === 'fatal' ? new Error().stack : undefined
    };
  }

  debug(context: LogContext, message: string, details?: Record<string, any>, userId?: string): void {
    if (!this.shouldLog('debug')) return;
    const entry = this.createEntry('debug', context, message, details, userId);
    this.writeLog(entry);
  }

  info(context: LogContext, message: string, details?: Record<string, any>, userId?: string): void {
    if (!this.shouldLog('info')) return;
    const entry = this.createEntry('info', context, message, details, userId);
    this.writeLog(entry);
  }

  warn(context: LogContext, message: string, details?: Record<string, any>, userId?: string): void {
    if (!this.shouldLog('warn')) return;
    const entry = this.createEntry('warn', context, message, details, userId);
    this.writeLog(entry);
  }

  error(context: LogContext, message: string, details?: Record<string, any>, userId?: string): void {
    if (!this.shouldLog('error')) return;
    const entry = this.createEntry('error', context, message, details, userId);
    this.writeLog(entry);
  }

  fatal(context: LogContext, message: string, details?: Record<string, any>, userId?: string): void {
    if (!this.shouldLog('fatal')) return;
    const entry = this.createEntry('fatal', context, message, details, userId);
    this.writeLog(entry);
  }

  // Métodos de conveniencia para contextos específicos
  conversion = {
    started: (conversionId: string, details?: Record<string, any>) => 
      this.info('conversion', `Conversion started: ${conversionId}`, { conversionId, ...details }),
    
    progress: (conversionId: string, progress: number, details?: Record<string, any>) =>
      this.debug('conversion', `Conversion progress: ${progress}%`, { conversionId, progress, ...details }),
    
    completed: (conversionId: string, details?: Record<string, any>) =>
      this.info('conversion', `Conversion completed: ${conversionId}`, { conversionId, ...details }),
    
    failed: (conversionId: string, error: Error, details?: Record<string, any>) =>
      this.error('conversion', `Conversion failed: ${error.message}`, { conversionId, error: error.message, stack: error.stack, ...details })
  };

  performance = {
    timing: (operation: string, duration: number, details?: Record<string, any>) =>
      this.info('performance', `Operation ${operation} took ${duration}ms`, { operation, duration, ...details }),
    
    slow: (operation: string, duration: number, threshold: number, details?: Record<string, any>) =>
      this.warn('performance', `Slow operation detected: ${operation} (${duration}ms > ${threshold}ms)`, { operation, duration, threshold, ...details })
  };
}

// Instancia global del logger
export const logger = Logger.getInstance();
