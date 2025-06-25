
import { LogTransport, LogEntry } from '../types';

export class ConsoleTransport implements LogTransport {
  name = 'console';

  async write(entry: LogEntry): Promise<void> {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.context}]`;
    
    const message = entry.details 
      ? `${prefix} ${entry.message} ${JSON.stringify(entry.details)}`
      : `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message);
        break;
      case 'info':
        console.info(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
      case 'fatal':
        console.error(message);
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }
  }
}
