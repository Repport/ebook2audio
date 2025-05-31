import { renderHook, act } from '@testing-library/react';
import { useConversionActions } from '../useConversionActions';
import { Chapter, ConvertToAudioResult, TextChunkCallbackPlaceholder } from '../../../types/hooks/conversion';

// Mock convertToAudio Service
vi.mock('@/services/conversion', () => ({
  convertToAudio: vi.fn()
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

// Mock global URL methods for handleDownload tests
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Example sessionStorage mock (can be in a setup file or per-test-file if needed)
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: any) => { store[key] = String(value); }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });


describe('useConversionActions', () => {
  let mockSetConversionStatus: ReturnType<typeof vi.fn>;
  let mockSetProgress: ReturnType<typeof vi.fn>;
  let mockSetAudioData: ReturnType<typeof vi.fn>;
  let mockSetAudioDuration: ReturnType<typeof vi.fn>;
  let mockSetConversionId: ReturnType<typeof vi.fn>;
  let mockSetCurrentFileName: ReturnType<typeof vi.fn>;
  let mockSetElapsedTime: ReturnType<typeof vi.fn>;
  let mockSetConversionStartTime: ReturnType<typeof vi.fn>;
  let mockClearConversionStorage: ReturnType<typeof vi.fn>;

  let mockConvertToAudioService: ReturnType<typeof vi.fn>;
  let mockToastFn: ReturnType<typeof vi.fn>;

  const initialProps = () => ({
    setConversionStatus: mockSetConversionStatus,
    setProgress: mockSetProgress,
    setAudioData: mockSetAudioData,
    setAudioDuration: mockSetAudioDuration,
    setConversionId: mockSetConversionId,
    setCurrentFileName: mockSetCurrentFileName,
    setElapsedTime: mockSetElapsedTime,
    setConversionStartTime: mockSetConversionStartTime,
    clearConversionStorage: mockClearConversionStorage,
  });

  beforeEach(() => {
    vi.resetAllMocks();

    mockSetConversionStatus = vi.fn();
    mockSetProgress = vi.fn();
    mockSetAudioData = vi.fn();
    mockSetAudioDuration = vi.fn();
    mockSetConversionId = vi.fn();
    mockSetCurrentFileName = vi.fn();
    mockSetElapsedTime = vi.fn();
    mockSetConversionStartTime = vi.fn();
    mockClearConversionStorage = vi.fn();

    mockConvertToAudioService = require('@/services/conversion').convertToAudio;
    mockToastFn = require('@/hooks/use-toast').useToast().toast;

    mockSessionStorage.clear();
    mockCreateObjectURL.mockReset();
    mockRevokeObjectURL.mockReset();
  });

  it('should be defined and return expected methods', () => {
    const { result } = renderHook(() => useConversionActions(
      initialProps().setConversionStatus,
      initialProps().setProgress,
      initialProps().setAudioData,
      initialProps().setAudioDuration,
      initialProps().setConversionId,
      initialProps().setCurrentFileName,
      initialProps().setElapsedTime,
      initialProps().setConversionStartTime,
      initialProps().clearConversionStorage
    ));
    expect(result.current.handleConversion).toBeDefined();
    expect(result.current.resetConversion).toBeDefined();
    expect(result.current.handleDownload).toBeDefined();
  });

  describe('handleConversion', () => {
    it('Successful Conversion (Happy Path)', async () => {
      const mockAudioData = new ArrayBuffer(8);
      const mockConversionId = 'test-conversion-id';
      mockConvertToAudioService.mockResolvedValue({ audio: mockAudioData, id: mockConversionId });

      const text = "Hello world";
      const voiceId = "test-voice";
      const fileName = "testFile.txt";

      const { result } = renderHook(() => useConversionActions(
        mockSetConversionStatus, mockSetProgress, mockSetAudioData, mockSetAudioDuration,
        mockSetConversionId, mockSetCurrentFileName, mockSetElapsedTime,
        mockSetConversionStartTime, mockClearConversionStorage
      ));

      await act(async () => {
        await result.current.handleConversion(text, voiceId, undefined, undefined, fileName);
      });

      expect(mockSetConversionStatus).toHaveBeenCalledWith('converting');
      expect(mockSetProgress).toHaveBeenCalledWith(0);
      expect(mockSetCurrentFileName).toHaveBeenCalledWith(fileName);
      expect(mockSetConversionStartTime).toHaveBeenCalledWith(expect.any(Number));
      expect(mockSetElapsedTime).toHaveBeenCalledWith(0); // Initially 0

      expect(mockConvertToAudioService).toHaveBeenCalledWith(text, voiceId, undefined);

      expect(mockSetAudioData).toHaveBeenCalledWith(mockAudioData);
      // Approximate duration: Math.ceil(text.length / 15)
      const expectedDuration = Math.ceil(text.length / 15);
      expect(mockSetAudioDuration).toHaveBeenCalledWith(expectedDuration);
      expect(mockSetConversionId).toHaveBeenCalledWith(mockConversionId);
      expect(mockSetConversionStatus).toHaveBeenCalledWith('completed'); // Last call
      expect(mockSetProgress).toHaveBeenCalledWith(100); // Last call
      expect(mockToastFn).not.toHaveBeenCalled();
    });

    it('Conversion of Empty Text', async () => {
      const mockAudioData = new ArrayBuffer(0); // Empty audio for empty text
      const mockConversionId = 'empty-text-id';
      mockConvertToAudioService.mockResolvedValue({ audio: mockAudioData, id: mockConversionId });

      const text = "";
      const voiceId = "test-voice";

      const { result } = renderHook(() => useConversionActions(
        mockSetConversionStatus, mockSetProgress, mockSetAudioData, mockSetAudioDuration,
        mockSetConversionId, mockSetCurrentFileName, mockSetElapsedTime,
        mockSetConversionStartTime, mockClearConversionStorage
      ));

      await act(async () => {
        await result.current.handleConversion(text, voiceId);
      });

      expect(mockSetConversionStatus).toHaveBeenCalledWith('converting');
      expect(mockSetCurrentFileName).toHaveBeenCalledWith(null); // No filename passed
      expect(mockConvertToAudioService).toHaveBeenCalledWith(text, voiceId, undefined);
      expect(mockSetAudioData).toHaveBeenCalledWith(mockAudioData);
      expect(mockSetAudioDuration).toHaveBeenCalledWith(0); // Math.ceil(0 / 15) = 0
      expect(mockSetConversionId).toHaveBeenCalledWith(mockConversionId);
      expect(mockSetConversionStatus).toHaveBeenCalledWith('completed');
      expect(mockSetProgress).toHaveBeenCalledWith(100);
      expect(mockToastFn).not.toHaveBeenCalled();
    });

    it('Error Handling - TTS Service Failure', async () => {
      const errorMessage = 'TTS service failed';
      mockConvertToAudioService.mockRejectedValue(new Error(errorMessage));

      const text = "Hello world";
      const voiceId = "test-voice";

      const { result } = renderHook(() => useConversionActions(
        mockSetConversionStatus, mockSetProgress, mockSetAudioData, mockSetAudioDuration,
        mockSetConversionId, mockSetCurrentFileName, mockSetElapsedTime,
        mockSetConversionStartTime, mockClearConversionStorage
      ));

      try {
        await act(async () => {
          await result.current.handleConversion(text, voiceId);
        });
      } catch (error: any) {
        expect(error.message).toBe(errorMessage);
      }

      expect(mockSetConversionStatus).toHaveBeenCalledWith('converting');
      expect(mockSetConversionStatus).toHaveBeenCalledWith('error'); // Last call
      expect(mockToastFn).toHaveBeenCalledWith({
        title: "Error en la conversión",
        description: errorMessage,
        variant: "destructive",
      });
      expect(mockSetAudioData).not.toHaveBeenCalledWith(expect.any(ArrayBuffer));
    });
  });

  describe('resetConversion', () => {
    it('should reset all conversion states', () => {
      const { result } = renderHook(() => useConversionActions(
        mockSetConversionStatus, mockSetProgress, mockSetAudioData, mockSetAudioDuration,
        mockSetConversionId, mockSetCurrentFileName, mockSetElapsedTime,
        mockSetConversionStartTime, mockClearConversionStorage
      ));

      act(() => {
        result.current.resetConversion();
      });

      expect(mockSetConversionStatus).toHaveBeenCalledWith('idle');
      expect(mockSetProgress).toHaveBeenCalledWith(0);
      expect(mockSetAudioData).toHaveBeenCalledWith(null);
      expect(mockSetAudioDuration).toHaveBeenCalledWith(0);
      expect(mockSetConversionId).toHaveBeenCalledWith(null);
      expect(mockSetCurrentFileName).toHaveBeenCalledWith(null);
      expect(mockSetElapsedTime).toHaveBeenCalledWith(0);
      expect(mockSetConversionStartTime).toHaveBeenCalledWith(undefined);
      expect(mockClearConversionStorage).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleDownload', () => {
    const originalCreateElement = document.createElement;

    beforeEach(() => {
        // Mock document.createElement to control the anchor element
        document.createElement = vi.fn().mockReturnValue({
            href: '',
            download: '',
            click: vi.fn(),
        });
    });

    afterEach(() => {
        document.createElement = originalCreateElement; // Restore original
    });

    it('Successful Download Trigger', () => {
      const fileName = "audio.mp3";
      const audioData = new ArrayBuffer(8);
      mockCreateObjectURL.mockReturnValue("blob:http://localhost/mock-url");

      const { result } = renderHook(() => useConversionActions(
        mockSetConversionStatus, mockSetProgress, mockSetAudioData, mockSetAudioDuration,
        mockSetConversionId, mockSetCurrentFileName, mockSetElapsedTime,
        mockSetConversionStartTime, mockClearConversionStorage
      ));

      act(() => {
        result.current.handleDownload(fileName, audioData);
      });

      const mockAnchor = document.createElement('a') as HTMLAnchorElement & { click: ReturnType<typeof vi.fn> };

      expect(mockCreateObjectURL).toHaveBeenCalledWith(new Blob([audioData], { type: 'audio/mpeg' }));
      expect(mockAnchor.click).toHaveBeenCalledTimes(1); // Check if the click method on the anchor element was called
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-url");
      expect(mockToastFn).not.toHaveBeenCalled();
    });

    it('Download with no Audio Data', () => {
      const fileName = "audio.mp3";
      const audioData = null;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});


      const { result } = renderHook(() => useConversionActions(
        mockSetConversionStatus, mockSetProgress, mockSetAudioData, mockSetAudioDuration,
        mockSetConversionId, mockSetCurrentFileName, mockSetElapsedTime,
        mockSetConversionStartTime, mockClearConversionStorage
      ));

      act(() => {
        result.current.handleDownload(fileName, audioData);
      });

      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockToastFn).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('No audio data to download');
      consoleErrorSpy.mockRestore();
    });
  });
});
