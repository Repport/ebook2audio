
import { describe, it, expect } from 'vitest';
import { compressToZip } from '../compressionService';

describe('compressionService', () => {
  describe('compressToZip', () => {
    it('should compress audio data', async () => {
      const mockAudio = new ArrayBuffer(1024);
      const { compressedData, compressionRatio } = await compressToZip(mockAudio);

      expect(compressedData).toBeTruthy();
      expect(compressedData.byteLength).toBeGreaterThan(0);
      expect(compressionRatio).toBeGreaterThan(0);
      expect(compressionRatio).toBeLessThan(1); // Compression should reduce size
    });

    it('should handle empty audio data', async () => {
      const mockAudio = new ArrayBuffer(0);
      
      await expect(compressToZip(mockAudio)).rejects.toThrow('Invalid audio data');
    });

    it('should achieve reasonable compression ratio', async () => {
      // Create mock audio data with some repetitive content
      const mockAudio = new ArrayBuffer(10000);
      const view = new Uint8Array(mockAudio);
      for (let i = 0; i < view.length; i++) {
        view[i] = i % 256; // Create some pattern for better compression
      }

      const { compressionRatio } = await compressToZip(mockAudio);
      expect(compressionRatio).toBeLessThan(0.9); // Should achieve at least 10% compression
    });
  });
});

