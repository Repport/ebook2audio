
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '@/shared/logging/Logger';
import { LogLevel, LogContext } from '@/shared/logging/types';

describe('Logger', () => {
  let logger: Logger;
  let mockConsole: any;

  beforeEach(() => {
    // Mock console methods
    mockConsole = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };

    // Create fresh logger instance
    logger = Logger.getInstance({
      level: 'debug',
      enableConsole: true,
      enableRemote: false,
      transports: []
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Log Levels', () => {
    it('should log debug messages when level is debug', () => {
      logger.debug('system', 'Test debug message');
      expect(mockConsole.debug).toHaveBeenCalled();
    });

    it('should not log debug messages when level is info', () => {
      const infoLogger = Logger.getInstance({ level: 'info' });
      infoLogger.debug('system', 'Test debug message');
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logger.info('system', 'Test info message');
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      logger.warn('system', 'Test warning message');
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('system', 'Test error message');
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('Convenience Methods', () => {
    it('should log conversion started', () => {
      logger.conversion.started('test-id', { fileName: 'test.txt' });
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Conversion started: test-id')
      );
    });

    it('should log conversion progress', () => {
      logger.conversion.progress('test-id', 50, { chunks: 5 });
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('Conversion progress: 50%')
      );
    });

    it('should log performance timing', () => {
      logger.performance.timing('test-operation', 1000, { size: 'large' });
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Operation test-operation took 1000ms')
      );
    });
  });

  describe('Context and Details', () => {
    it('should include context in log messages', () => {
      logger.info('conversion', 'Test message');
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[conversion]')
      );
    });

    it('should include details in log messages', () => {
      logger.info('system', 'Test message', { key: 'value' });
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('{"key":"value"}')
      );
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      expect(logger1).toBe(logger2);
    });
  });
});
