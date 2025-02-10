
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  splitAudioIntoChunks,
  uploadAudioChunk,
  checkAllChunksUploaded,
  combineChunks
} from '../audioChunkService';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn()
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      eq: vi.fn(),
      upsert: vi.fn()
    }))
  }
}));

describe('audioChunkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('splitAudioIntoChunks', () => {
    it('should split audio into appropriate chunks', async () => {
      const mockAudio = new ArrayBuffer(10 * 1024 * 1024); // 10MB
      const chunks = await splitAudioIntoChunks(mockAudio);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toHaveProperty('chunk');
      expect(chunks[0]).toHaveProperty('index');
      expect(chunks[0]).toHaveProperty('hash');
    });

    it('should create chunks of appropriate size', async () => {
      const mockAudio = new ArrayBuffer(7 * 1024 * 1024); // 7MB
      const chunks = await splitAudioIntoChunks(mockAudio);

      // Should create 2 chunks since chunk size is 5MB
      expect(chunks.length).toBe(2);
    });
  });

  describe('uploadAudioChunk', () => {
    const mockConversionId = 'test-conversion-id';
    const mockChunk = {
      chunk: new ArrayBuffer(1024),
      index: 0,
      hash: 'test-hash'
    };

    it('should successfully upload a chunk', async () => {
      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null })
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null })
      } as any);

      const result = await uploadAudioChunk(mockConversionId, mockChunk);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle upload failures', async () => {
      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: new Error('Upload failed') })
      } as any);

      const result = await uploadAudioChunk(mockConversionId, mockChunk);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('checkAllChunksUploaded', () => {
    const mockConversionId = 'test-conversion-id';

    it('should return true when all chunks are uploaded', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ status: 'uploaded' }, { status: 'uploaded' }],
            error: null
          })
        })
      } as any);

      const result = await checkAllChunksUploaded(mockConversionId);
      expect(result).toBe(true);
    });

    it('should return false when some chunks are missing', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ status: 'uploaded' }, { status: 'pending' }],
            error: null
          })
        })
      } as any);

      const result = await checkAllChunksUploaded(mockConversionId);
      expect(result).toBe(false);
    });
  });

  describe('combineChunks', () => {
    const mockConversionId = 'test-conversion-id';

    it('should successfully combine chunks', async () => {
      const mockChunks = [
        { storage_path: 'chunk1', chunk_index: 0 },
        { storage_path: 'chunk2', chunk_index: 1 }
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockChunks,
            error: null
          })
        })
      } as any);

      vi.mocked(supabase.storage.from).mockReturnValue({
        download: vi.fn().mockResolvedValue({
          data: new Blob(['chunk data']),
          error: null
        })
      } as any);

      const result = await combineChunks(mockConversionId);
      expect(result).toBeTruthy();
    });

    it('should return null when chunks cannot be retrieved', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        })
      } as any);

      const result = await combineChunks(mockConversionId);
      expect(result).toBeNull();
    });
  });
});

