import { convertTextToAudio } from '../conversionService';
import { ChunkManager } from '../chunkManager';
import { processChunksInParallel } from '../parallelProcessing';
import { combineAudioBuffers } from '../audioUtils';
import { useConversionStore } from '@/store/conversionStore';
import { LoggingService } from '@/utils/loggingService';
import { updateConversionProgress } from '../../progressService';
import { randomUUID } from 'crypto';
import { TextChunkCallback } from '../../types/chunks';

// Mock all dependencies
vi.mock('../chunkManager');
vi.mock('../parallelProcessing');
vi.mock('../audioUtils');
vi.mock('@/store/conversionStore');
vi.mock('@/utils/loggingService');
vi.mock('../../progressService');
vi.mock('crypto');

describe('convertTextToAudio', () => {
  let mockStoreState: any;
  let mockChunkManagerInstance: any;
  let mockProcessChunksInParallel: ReturnType<typeof vi.fn>;
  let mockCombineAudioBuffers: ReturnType<typeof vi.fn>;
  let mockLoggingServiceInfo: ReturnType<typeof vi.fn>;
  let mockLoggingServiceError: ReturnType<typeof vi.fn>;
  let mockUpdateConversionProgress: ReturnType<typeof vi.fn>;
  let mockRandomUUID: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    // Mock useConversionStore
    mockStoreState = {
      startConversion: vi.fn(),
      updateProgress: vi.fn(),
      setError: vi.fn(),
      setWarning: vi.fn(),
      completeConversion: vi.fn(),
      status: 'idle',
      progress: 0,
      chunks: [],
      audioData: null,
    };
    (useConversionStore.getState as ReturnType<typeof vi.fn>).mockReturnValue(mockStoreState);

    // Mock ChunkManager instance and implementation
    mockChunkManagerInstance = {
      getTotalChunks: vi.fn(() => 1),
      getTotalCharacters: vi.fn(() => 100),
      getOrderedBuffers: vi.fn(() => [new ArrayBuffer(10)]),
      getMissingChunks: vi.fn(() => []),
      notifyCompletion: vi.fn(),
      // Add any other methods of ChunkManager that are called by convertTextToAudio
      // e.g. if progressCallback uses methods of chunkManagerInstance
      updateChunkProgress: vi.fn(),
      setAudioBuffer: vi.fn(),
      getTextForChunk: vi.fn((chunkIndex: number) => `Text for chunk ${chunkIndex}`),
      chunks: [{ text: "Sample text", hash: "hash123", attempts: 0, progress: 0, status: 'pending' }], // Mock chunks array
    };
    (ChunkManager as ReturnType<typeof vi.fn>).mockImplementation(() => mockChunkManagerInstance);

    // Assign other mocked functions
    mockProcessChunksInParallel = processChunksInParallel as ReturnType<typeof vi.fn>;
    mockCombineAudioBuffers = combineAudioBuffers as ReturnType<typeof vi.fn>;
    mockLoggingServiceInfo = LoggingService.info as ReturnType<typeof vi.fn>;
    mockLoggingServiceError = LoggingService.error as ReturnType<typeof vi.fn>;
    mockUpdateConversionProgress = updateConversionProgress as ReturnType<typeof vi.fn>;
    mockRandomUUID = randomUUID as ReturnType<typeof vi.fn>;

    // Default mock implementations
    mockCombineAudioBuffers.mockReturnValue(new ArrayBuffer(10));
    mockRandomUUID.mockReturnValue('test-conversion-id');
    mockProcessChunksInParallel.mockResolvedValue(undefined); // Default to successful parallel processing
  });

  describe('Input Validation', () => {
    it('should throw an error if text is empty', async () => {
      await expect(convertTextToAudio("", "voice1")).rejects.toThrow("Text and voiceId are required for conversion.");
      expect(mockStoreState.setError).toHaveBeenCalledWith(expect.stringContaining("Text and voiceId are required"));
      expect(mockLoggingServiceError).toHaveBeenCalled();
    });

    it('should throw an error if voiceId is null', async () => {
      // @ts-ignore // Testing invalid input
      await expect(convertTextToAudio("sample text", null)).rejects.toThrow("Text and voiceId are required for conversion.");
      expect(mockStoreState.setError).toHaveBeenCalledWith(expect.stringContaining("Text and voiceId are required"));
      expect(mockLoggingServiceError).toHaveBeenCalled();
    });
  });

  describe('Successful Conversion (All Chunks)', () => {
    it('should process successfully and return audio data', async () => {
      const text = "sample text";
      const voiceId = "voice1";
      const mockOnProgress = vi.fn();
      const expectedAudio = new ArrayBuffer(10);
      mockCombineAudioBuffers.mockReturnValue(expectedAudio);

      const result = await convertTextToAudio(text, voiceId, mockOnProgress);

      expect(mockStoreState.startConversion).toHaveBeenCalledWith('test-conversion-id');
      expect(ChunkManager).toHaveBeenCalledWith(text, expect.any(Function)); // progressCallback
      expect(mockLoggingServiceInfo).toHaveBeenCalledWith(expect.stringContaining("Conversion started"), 'test-conversion-id');
      expect(mockProcessChunksInParallel).toHaveBeenCalledWith(mockChunkManagerInstance, voiceId, expect.any(Function));
      expect(mockChunkManagerInstance.getOrderedBuffers).toHaveBeenCalled();
      expect(mockChunkManagerInstance.getMissingChunks).toHaveBeenCalled();
      expect(mockCombineAudioBuffers).toHaveBeenCalledWith([expectedAudio]); // getOrderedBuffers returns [expectedAudio]
      expect(mockStoreState.completeConversion).toHaveBeenCalledWith('test-conversion-id', expectedAudio);
      expect(mockLoggingServiceInfo).toHaveBeenCalledWith(expect.stringContaining("Conversion completed successfully"), 'test-conversion-id');

      // Test progressCallback being called (indirectly via ChunkManager instantiation and processChunksInParallel)
      // This is tricky as it's wrapped. We check if updateConversionProgress and onProgress are called.
      // Simulate a call to the progress callback that was passed to ChunkManager
      const progressCallbackArg = (ChunkManager as ReturnType<typeof vi.fn>).mock.calls[0][1];
      progressCallbackArg(0, 50, 100); // chunkIndex, chunkProgress, overallProgress
      expect(mockUpdateConversionProgress).toHaveBeenCalledWith('test-conversion-id', 0, 50, 100); // Check specific call based on internal logic
      expect(mockOnProgress).toHaveBeenCalled(); // Check if the external onProgress was called

      expect(result.audio).toBe(expectedAudio);
      expect(result.id).toBe('test-conversion-id');
    });
  });

  describe('Partial Success (Some Chunks Missing)', () => {
    it('should complete with a warning if some chunks are missing', async () => {
      const text = "sample text";
      const voiceId = "voice1";
      const partialAudio = new ArrayBuffer(5);
      mockChunkManagerInstance.getMissingChunks.mockReturnValueOnce([1]); // Simulate one missing chunk
      mockChunkManagerInstance.getOrderedBuffers.mockReturnValueOnce([partialAudio]); // Only one buffer returned
      mockCombineAudioBuffers.mockReturnValue(partialAudio);


      const result = await convertTextToAudio(text, voiceId);

      expect(mockStoreState.startConversion).toHaveBeenCalled();
      expect(mockProcessChunksInParallel).toHaveBeenCalled();
      expect(mockCombineAudioBuffers).toHaveBeenCalledWith([partialAudio]);
      expect(mockStoreState.setWarning).toHaveBeenCalledWith('test-conversion-id', expect.stringContaining("completed with missing chunks"));
      expect(mockStoreState.completeConversion).toHaveBeenCalledWith('test-conversion-id', partialAudio); // Still completes with what it has
      expect(mockLoggingServiceInfo).toHaveBeenCalledWith(expect.stringContaining("completed with missing chunks"), 'test-conversion-id');
      expect(result.audio).toBe(partialAudio);
      expect(result.id).toBe('test-conversion-id');
    });
  });

  describe('Critical Failures', () => {
    it('should throw error if no chunks were processed', async () => {
      mockChunkManagerInstance.getOrderedBuffers.mockReturnValueOnce([]); // No buffers

      await expect(convertTextToAudio("text", "voice")).rejects.toThrow("No audio data processed.");
      expect(mockStoreState.setError).toHaveBeenCalledWith('test-conversion-id', expect.stringContaining("No audio data processed"));
      expect(mockLoggingServiceError).toHaveBeenCalledWith(expect.stringContaining("No audio data processed"), 'test-conversion-id');
    });

    it('should throw error if combined buffer is empty', async () => {
      mockCombineAudioBuffers.mockReturnValueOnce(new ArrayBuffer(0)); // Empty buffer

      await expect(convertTextToAudio("text", "voice")).rejects.toThrow("Combined audio data is empty.");
      expect(mockStoreState.setError).toHaveBeenCalledWith('test-conversion-id', expect.stringContaining("Combined audio data is empty"));
      expect(mockLoggingServiceError).toHaveBeenCalledWith(expect.stringContaining("Combined audio data is empty"), 'test-conversion-id');
    });

    it('should throw error if processChunksInParallel fails', async () => {
      const parallelError = new Error('Parallel processing failed');
      mockProcessChunksInParallel.mockRejectedValueOnce(parallelError);

      await expect(convertTextToAudio("text", "voice")).rejects.toThrow(parallelError);
      expect(mockStoreState.setError).toHaveBeenCalledWith('test-conversion-id', expect.stringContaining("Error during parallel processing"));
      expect(mockLoggingServiceError).toHaveBeenCalledWith(expect.stringContaining("Error during parallel processing: Parallel processing failed"), 'test-conversion-id');
    });
  });

  describe('Progress Callback Logic', () => {
    it('progressCallback passed to ChunkManager is functional and throttled', () => {
      vi.useFakeTimers();
      const text = "sample text";
      const voiceId = "voice1";
      const mockOnProgress = vi.fn();

      convertTextToAudio(text, voiceId, mockOnProgress); // Call does not need to be awaited for this specific test

      const progressCallbackArg = (ChunkManager as ReturnType<typeof vi.fn>).mock.calls[0][1];

      // Call 1 - should execute
      progressCallbackArg(0, 50, 25);
      expect(mockUpdateConversionProgress).toHaveBeenCalledTimes(1);
      expect(mockUpdateConversionProgress).toHaveBeenLastCalledWith('test-conversion-id', 0, 50, 25);
      expect(mockOnProgress).toHaveBeenCalledTimes(1);
      expect(mockOnProgress).toHaveBeenLastCalledWith(expect.objectContaining({ overallProgress: 25 }));

      // Call 2 - within throttle time (default 250ms), should be skipped for external onProgress
      progressCallbackArg(0, 75, 35);
      expect(mockUpdateConversionProgress).toHaveBeenCalledTimes(2); // Internal updateConversionProgress still called
      expect(mockUpdateConversionProgress).toHaveBeenLastCalledWith('test-conversion-id', 0, 75, 35);
      expect(mockOnProgress).toHaveBeenCalledTimes(1); // External onProgress not called again yet

      // Advance timers
      vi.advanceTimersByTime(300);

      // Call 3 - after throttle time, should execute for external onProgress
      progressCallbackArg(0, 100, 50);
      expect(mockUpdateConversionProgress).toHaveBeenCalledTimes(3);
      expect(mockUpdateConversionProgress).toHaveBeenLastCalledWith('test-conversion-id', 0, 100, 50);
      expect(mockOnProgress).toHaveBeenCalledTimes(2); // External onProgress called again
      expect(mockOnProgress).toHaveBeenLastCalledWith(expect.objectContaining({ overallProgress: 50 }));

      // Call 4 - same overall progress, should be skipped for external onProgress due to hash check
      progressCallbackArg(1, 20, 50); // Different chunk, same overall progress
      expect(mockUpdateConversionProgress).toHaveBeenCalledTimes(4);
      expect(mockUpdateConversionProgress).toHaveBeenLastCalledWith('test-conversion-id', 1, 20, 50);
      expect(mockOnProgress).toHaveBeenCalledTimes(2); // Still 2, overall progress hasn't changed for notification

      vi.useRealTimers();
    });
  });
});
