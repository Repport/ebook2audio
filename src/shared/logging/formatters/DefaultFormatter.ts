
import { LogFormatter, LogEntry } from '../types';

export class DefaultFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context.padEnd(12);
    
    let message = `${timestamp} ${level} ${context} ${entry.message}`;
    
    if (entry.details && Object.keys(entry.details).length > 0) {
      message += ` ${JSON.stringify(entry.details)}`;
    }
    
    return message;
  }
}
