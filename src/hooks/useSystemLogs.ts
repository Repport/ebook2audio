
import { DatabaseLogEntry } from '@/types/database';

export const useSystemLogs = () => {
  const getLogLevel = (log: DatabaseLogEntry): 'error' | 'warning' | 'info' | 'debug' => {
    return log.level || 'info';
  };

  const getLogTimestamp = (log: DatabaseLogEntry): string => {
    if (log.created_at) {
      return new Date(log.created_at).toLocaleString();
    }
    return new Date().toLocaleString();
  };

  const getLogMessage = (log: DatabaseLogEntry): string => {
    return log.message || 'No message';
  };

  return {
    getLogLevel,
    getLogTimestamp,
    getLogMessage
  };
};
