
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { saveToSupabase, testStorageConnection } from '../supabaseStorageService';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        remove: vi.fn()
      }))
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
      update: vi.fn()
    }))
  }
}));

describe('supabaseStorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('testStorageConnection', () => {
    it('should return true when storage connection is successful', async () => {
      // Mock successful auth
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      } as any);

      // Mock successful upload
      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        remove: vi.fn().mockResolvedValue({ error: null })
      } as any);

      const result = await testStorageConnection();
      expect(result).toBe(true);
    });

    it('should return false when storage upload fails', async () => {
      // Mock successful auth but failed upload
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      } as any);

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: new Error('Upload failed') }),
        remove: vi.fn()
      } as any);

      const result = await testStorageConnection();
      expect(result).toBe(false);
    });
  });

  describe('saveToSupabase', () => {
    const mockAudio = new ArrayBuffer(1024);
    const mockText = 'Test text';
    const mockDuration = 120;
    const mockFileName = 'test.mp3';
    const mockUserId = 'test-user-id';

    it('should successfully save audio to Supabase', async () => {
      // Mock successful auth
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      } as any);

      // Mock successful storage operations
      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        remove: vi.fn().mockResolvedValue({ error: null })
      } as any);

      // Mock successful database operations
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockResolvedValue({ error: null })
      } as any);

      const result = await saveToSupabase(
        mockAudio,
        mockText,
        mockDuration,
        mockFileName,
        mockUserId
      );

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string'); // Should return conversion ID
    });

    it('should handle storage upload failure', async () => {
      // Mock successful auth but failed upload
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      } as any);

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: new Error('Upload failed') }),
        remove: vi.fn()
      } as any);

      await expect(
        saveToSupabase(
          mockAudio,
          mockText,
          mockDuration,
          mockFileName,
          mockUserId
        )
      ).rejects.toThrow('Failed to upload');
    });

    it('should handle database operation failure', async () => {
      // Mock successful auth but failed database operation
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      } as any);

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        remove: vi.fn()
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: new Error('Database error') }),
        update: vi.fn()
      } as any);

      await expect(
        saveToSupabase(
          mockAudio,
          mockText,
          mockDuration,
          mockFileName,
          mockUserId
        )
      ).rejects.toThrow('Failed to create conversion record');
    });

    it('should handle compression errors', async () => {
      // Mock successful auth but compression failure
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      } as any);

      // Force compression to fail
      const mockError = new Error('Compression failed');
      vi.mock('../compressionService', () => ({
        compressToZip: vi.fn().mockRejectedValue(mockError)
      }));

      await expect(
        saveToSupabase(
          mockAudio,
          mockText,
          mockDuration,
          mockFileName,
          mockUserId
        )
      ).rejects.toThrow('Compression failed');
    });
  });
});

