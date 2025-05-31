import { renderHook, act } from '@testing-library/react';
import { useProcessorConversion } from '../useProcessorConversion';
import { UseProcessorConversionProps } from '../../../types/hooks/processor';
import { Chapter, ConvertToAudioResult, TextChunkCallbackPlaceholder } from '../../../types/hooks/conversion';

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

describe('useProcessorConversion', () => {
  // Default Mock Props
  let mockSelectedFile: File | null;
  let mockExtractedText: string;
  let mockChapters: Chapter[];
  let mockSelectedVoice: string;
  let mockNotifyOnComplete: boolean;
  let mockCurrentStep: number;
  let mockShowTerms: boolean;
  let mockSetShowTerms: ReturnType<typeof vi.fn>;
  let mockOnNextStep: ReturnType<typeof vi.fn>;
  let mockStartAudioConversionProcess: ReturnType<typeof vi.fn<any[], Promise<ConvertToAudioResult>>>;
  let mockSetIsProcessingGlobal: ReturnType<typeof vi.fn>;
  let mockToastFn: ReturnType<typeof vi.fn>;

  let defaultProps: UseProcessorConversionProps;

  beforeEach(() => {
    vi.resetAllMocks();

    mockSelectedFile = new File(['content'], 'test.epub', { type: 'application/epub+zip' });
    mockExtractedText = 'Some sample text';
    mockChapters = [{ id: '1', title: 'Chapter 1', startTime: 0, endTime: 0 }];
    mockSelectedVoice = 'voice-id-123';
    mockNotifyOnComplete = false;
    mockCurrentStep = 2; // Default to a step where terms might be shown
    mockShowTerms = false; // Default to terms not shown initially

    mockSetShowTerms = vi.fn();
    mockOnNextStep = vi.fn();
    mockStartAudioConversionProcess = vi.fn(async () => ({ audio: new ArrayBuffer(1), id: 'conv-id' }));
    mockSetIsProcessingGlobal = vi.fn();

    mockToastFn = require('@/hooks/use-toast').useToast().toast;

    defaultProps = {
      selectedFile: mockSelectedFile,
      extractedText: mockExtractedText,
      chapters: mockChapters,
      selectedVoice: mockSelectedVoice,
      notifyOnComplete: mockNotifyOnComplete,
      currentStep: mockCurrentStep,
      showTerms: mockShowTerms,
      setShowTerms: mockSetShowTerms,
      onNextStep: mockOnNextStep,
      startAudioConversionProcess: mockStartAudioConversionProcess,
      setIsProcessingGlobal: mockSetIsProcessingGlobal,
    };
  });

  const getHookResult = (props: Partial<UseProcessorConversionProps> = {}) => {
    return renderHook(() => useProcessorConversion({ ...defaultProps, ...props })).result;
  };

  describe('handleStartConversion', () => {
    it('Terms are required (currentStep === 2)', async () => {
      const result = getHookResult({ currentStep: 2, showTerms: false });
      let success: boolean = false;
      await act(async () => {
        success = await result.current.handleStartConversion();
      });

      expect(success).toBe(true); // Indicates terms are the next logical step
      expect(mockSetShowTerms).toHaveBeenCalledWith(true);
      expect(mockStartAudioConversionProcess).not.toHaveBeenCalled();
      expect(mockSetIsProcessingGlobal).toHaveBeenCalledTimes(2); // true then false
      expect(mockSetIsProcessingGlobal).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsProcessingGlobal).toHaveBeenNthCalledWith(2, false);
    });

    it('Terms are required (showTerms === true)', async () => {
      const result = getHookResult({ currentStep: 3, showTerms: true });
      let success: boolean = false;
      await act(async () => {
        success = await result.current.handleStartConversion();
      });

      expect(success).toBe(true); // Indicates terms are the next logical step
      expect(mockSetShowTerms).toHaveBeenCalledWith(true); // It might be called even if already true, depending on logic
      expect(mockStartAudioConversionProcess).not.toHaveBeenCalled();
      expect(mockSetIsProcessingGlobal).toHaveBeenCalledTimes(2);
      expect(mockSetIsProcessingGlobal).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsProcessingGlobal).toHaveBeenNthCalledWith(2, false);
    });

    it('Terms not required - conversion proceeds', async () => {
      const result = getHookResult({ currentStep: 3, showTerms: false });
      let success: boolean = false;
      await act(async () => {
        success = await result.current.handleStartConversion();
      });

      expect(success).toBe(true);
      expect(mockSetShowTerms).not.toHaveBeenCalledWith(true);
      expect(mockOnNextStep).toHaveBeenCalledTimes(1);
      expect(mockStartAudioConversionProcess).toHaveBeenCalledWith(
        mockExtractedText,
        mockSelectedVoice,
        mockChapters,
        mockSelectedFile?.name,
        // undefined for onProgress was passed in implementation
      );
      expect(mockSetIsProcessingGlobal).toHaveBeenCalledTimes(2); // true then false
      expect(mockSetIsProcessingGlobal).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsProcessingGlobal).toHaveBeenNthCalledWith(2, false);
    });

    it('Conversion proceeds if currentStep is not 2 and showTerms is false', async () => {
      const result = getHookResult({ currentStep: 1, showTerms: false }); // e.g. step 1, terms not yet relevant
      let success: boolean = false;
      await act(async () => {
        success = await result.current.handleStartConversion();
      });

      expect(success).toBe(true);
      expect(mockSetShowTerms).not.toHaveBeenCalledWith(true);
      expect(mockOnNextStep).toHaveBeenCalledTimes(1);
      expect(mockStartAudioConversionProcess).toHaveBeenCalled();
      expect(mockSetIsProcessingGlobal).toHaveBeenCalledTimes(2);
    });


    it('Prerequisite missing (no selectedFile)', async () => {
      const result = getHookResult({ selectedFile: null });
      let success: boolean = true; // Expect it to be set to false
      await act(async () => {
        success = await result.current.handleStartConversion();
      });

      expect(success).toBe(false);
      expect(mockStartAudioConversionProcess).not.toHaveBeenCalled();
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
        title: "Error",
        description: "Missing required data for conversion (file, text, or voice).",
        variant: "destructive",
      }));
      expect(mockSetIsProcessingGlobal).toHaveBeenCalledTimes(2); // true then false
      expect(mockSetIsProcessingGlobal).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsProcessingGlobal).toHaveBeenNthCalledWith(2, false);
    });

    it('Prerequisite missing (no extractedText)', async () => {
      const result = getHookResult({ extractedText: '' });
      let success: boolean = true;
      await act(async () => {
        success = await result.current.handleStartConversion();
      });
      expect(success).toBe(false);
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
        description: "Missing required data for conversion (file, text, or voice).",
      }));
      expect(mockSetIsProcessingGlobal).toHaveBeenCalledTimes(2);
    });

    it('startAudioConversionProcess throws an error', async () => {
      const errorMessage = "TTS service exploded";
      mockStartAudioConversionProcess.mockRejectedValueOnce(new Error(errorMessage));
      const result = getHookResult({ currentStep: 3, showTerms: false }); // Terms not required

      let success: boolean = true;
      await act(async () => {
        success = await result.current.handleStartConversion();
      });

      expect(success).toBe(false);
      expect(mockOnNextStep).toHaveBeenCalledTimes(1); // Called before the attempt
      expect(mockStartAudioConversionProcess).toHaveBeenCalled();
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
        title: "Conversion Error",
        description: errorMessage,
      }));
      expect(mockSetIsProcessingGlobal).toHaveBeenCalledTimes(2); // true then false
    });
  });

  describe('handleTermsAccept', () => {
    it('Successfully accepts terms and starts conversion', async () => {
      const result = getHookResult(); // Uses defaultProps where currentStep = 2
      const termOptions = { selectedVoice: 'new-voice-for-terms', notifyOnComplete: true };

      await act(async () => {
        await result.current.handleTermsAccept(termOptions);
      });

      expect(mockSetShowTerms).toHaveBeenCalledWith(false);
      expect(mockOnNextStep).toHaveBeenCalledTimes(1);
      expect(mockStartAudioConversionProcess).toHaveBeenCalledWith(
        mockExtractedText,
        termOptions.selectedVoice,
        mockChapters,
        mockSelectedFile?.name,
        // undefined for onProgress
      );
      expect(mockSetIsProcessingGlobal).toHaveBeenCalledTimes(2); // true then false
      expect(mockSetIsProcessingGlobal).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsProcessingGlobal).toHaveBeenNthCalledWith(2, false);
    });

    it('startAudioConversionProcess throws error during handleTermsAccept', async () => {
      const errorMessage = "TTS failed after terms";
      mockStartAudioConversionProcess.mockRejectedValueOnce(new Error(errorMessage));
      const result = getHookResult();
      const termOptions = { selectedVoice: 'voice-after-terms', notifyOnComplete: false };

      await act(async () => {
        await result.current.handleTermsAccept(termOptions);
      });

      expect(mockSetShowTerms).toHaveBeenCalledWith(false);
      expect(mockOnNextStep).toHaveBeenCalledTimes(1);
      expect(mockStartAudioConversionProcess).toHaveBeenCalled();
      expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
        title: "Conversion Error",
        description: errorMessage,
      }));
      expect(mockSetIsProcessingGlobal).toHaveBeenCalledTimes(2); // true then false
    });
  });
});
