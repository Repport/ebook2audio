
import { logger } from '../logging';

export class PerformanceTracker {
  private timers = new Map<string, number>();

  start(operation: string): void {
    this.timers.set(operation, performance.now());
  }

  end(operation: string, details?: Record<string, any>): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      logger.warn('performance', `Timer not found for operation: ${operation}`);
      return 0;
    }

    const duration = Math.round(performance.now() - startTime);
    this.timers.delete(operation);

    logger.performance.timing(operation, duration, details);

    // Log slow operations (>5 seconds)
    if (duration > 5000) {
      logger.performance.slow(operation, duration, 5000, details);
    }

    return duration;
  }

  measure<T>(operation: string, fn: () => Promise<T>, details?: Record<string, any>): Promise<T> {
    return this.measureSync(operation, fn, details);
  }

  measureSync<T>(operation: string, fn: () => T, details?: Record<string, any>): T {
    this.start(operation);
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.finally(() => this.end(operation, details)) as T;
      } else {
        this.end(operation, details);
        return result;
      }
    } catch (error) {
      this.end(operation, { ...details, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}

export const performanceTracker = new PerformanceTracker();
