
import { useState, useCallback } from 'react';
import { DatabaseLogEntry } from '@/utils/logging/types';

export function useSystemLogs() {
  // Helper function to get the log level
  const getLogLevel = useCallback((log: DatabaseLogEntry): 'error' | 'warning' | 'info' | 'debug' => {
    if (log.status === 'error') return 'error';
    if (log.status === 'warning') return 'warning';
    if (log.status === 'debug') return 'debug';
    return 'info';
  }, []);

  // Helper function to get the timestamp
  const getLogTimestamp = useCallback((log: DatabaseLogEntry): string => {
    try {
      const date = new Date(log.created_at);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  }, []);

  // Helper function to get the message
  const getLogMessage = useCallback((log: DatabaseLogEntry): string => {
    if (log.event_type) return log.event_type;
    if (log.details && typeof log.details === 'object' && 'message' in log.details) {
      return String(log.details.message);
    }
    return 'Unknown event';
  }, []);

  return {
    getLogLevel,
    getLogTimestamp,
    getLogMessage
  };
}
