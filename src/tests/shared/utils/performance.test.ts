
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerformanceTracker } from '@/shared/utils/performance';

describe('PerformanceTracker', () => {
  let tracker: PerformanceTracker;

  beforeEach(() => {
    tracker = new PerformanceTracker();
    vi.clearAllMocks();
  });

  describe('Basic Timing', () => {
    it('should measure operation duration', async () => {
      const operation = 'test-operation';
      
      tracker.start(operation);
      await new Promise(resolve => setTimeout(resolve, 10));
      const duration = tracker.end(operation);
      
      expect(duration).toBeGreaterThan(0);
    });

    it('should handle operations that do not exist', () => {
      const duration = tracker.end('non-existent-operation');
      expect(duration).toBe(0);
    });
  });

  describe('Measure Function', () => {
    it('should measure sync function execution', () => {
      const result = tracker.measureSync('sync-test', () => {
        return 'test-result';
      });
      
      expect(result).toBe('test-result');
    });

    it('should measure async function execution', async () => {
      const result = await tracker.measure('async-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async-result';
      });
      
      expect(result).toBe('async-result');
    });

    it('should handle errors in measured functions', () => {
      expect(() => {
        tracker.measureSync('error-test', () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');
    });
  });

  describe('Multiple Operations', () => {
    it('should track multiple operations simultaneously', () => {
      tracker.start('operation1');
      tracker.start('operation2');
      
      const duration1 = tracker.end('operation1');
      const duration2 = tracker.end('operation2');
      
      expect(duration1).toBeGreaterThanOrEqual(0);
      expect(duration2).toBeGreaterThanOrEqual(0);
    });
  });
});
