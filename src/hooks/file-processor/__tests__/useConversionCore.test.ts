import { renderHook } from '@testing-library/react';
import { useConversionCore } from '../useConversionCore';
import {
    UseConversionCoreReturn,
    Chapter,
    UseAudioConversionReturn,
    ConvertToAudioResult,
    TextChunkCallbackPlaceholder
} from '../../../types/hooks/conversion';

// Mock Composed Hooks
vi.mock('@/hooks/useAudioConversion', () => ({ useAudioConversion: vi.fn() }));
vi.mock('../useTermsAndNotifications', () => ({ useTermsAndNotifications: vi.fn() }));
vi.mock('../useChaptersDetection', () => ({ useChaptersDetection: vi.fn() }));
vi.mock('../useConversionEstimation', () => ({ useConversionEstimation: vi.fn() }));

describe('useConversionCore', () => {
    // Mock return values for composed hooks
    let mockAudioConversionReturnValue: UseAudioConversionReturn;
    let mockTermsReturnValue: { showTerms: boolean; setShowTerms: ReturnType<typeof vi.fn>; };
    let mockChaptersReturnValue: { detectChapters: boolean; setDetectChapters: ReturnType<typeof vi.fn>; detectingChapters: boolean; };
    let mockEstimationReturnValue: { calculateEstimatedSeconds: ReturnType<typeof vi.fn>; };

    // Mocks for functions within those return values
    let mockExecuteTTSConversionFn: ReturnType<typeof vi.fn>;
    let mockCancelConversionFn: ReturnType<typeof vi.fn>; // Mapped to resetConversion
    let mockHandleDownloadFn: ReturnType<typeof vi.fn>;
    let mockSetShowTermsFn: ReturnType<typeof vi.fn>;
    let mockSetDetectChaptersFn: ReturnType<typeof vi.fn>;
    let mockCalculateEstimatedSecondsFn: ReturnType<typeof vi.fn>;

    // Props for useConversionCore
    const mockSelectedFile = new File(["content"], "test.txt", { type: "text/plain" });
    const mockExtractedText = "This is extracted text.";
    const mockInitialChapters: Chapter[] = [{ id: "1", title: "Initial Chapter", startTime: 0, endTime: 10 }];
    const mockOnStepComplete = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();

        // Initialize individual mock functions
        mockExecuteTTSConversionFn = vi.fn(async () => ({ audio: new ArrayBuffer(0), id: 'tts-id' }));
        mockCancelConversionFn = vi.fn();
        mockHandleDownloadFn = vi.fn(); // This is on UseAudioConversionReturn, but useConversionCore should expose its own version based on it
        mockSetShowTermsFn = vi.fn();
        mockSetDetectChaptersFn = vi.fn();
        mockCalculateEstimatedSecondsFn = vi.fn(() => 120);

        // Setup mock return values for composed hooks
        mockAudioConversionReturnValue = {
            executeTTSConversion: mockExecuteTTSConversionFn,
            cancelConversion: mockCancelConversionFn, // This will be mapped to resetConversion
            isConverting: false,
            conversionProgress: 0,
            error: null,
            convertedFileUrl: null,
            convertedChapters: [],
            startConversion: vi.fn(), // Placeholder from UseAudioConversionReturn
            // The actual handleDownload from UseAudioConversionReturn is a wrapper.
            // UseConversionCoreReturn defines its own handleDownloadClick.
            // For testing, we assume useAudioConversion provides a basic download function if needed,
            // or useConversionCore wraps it. The current useConversionCore implementation has a placeholder for handleDownloadClick.
            // Let's add a mock handleDownload to mockAudioConversionReturnValue for completeness.
            handleDownload: mockHandleDownloadFn,
        };

        mockTermsReturnValue = {
            showTerms: false,
            setShowTerms: mockSetShowTermsFn,
        };

        mockChaptersReturnValue = {
            detectChapters: false,
            setDetectChapters: mockSetDetectChaptersFn,
            detectingChapters: false,
        };

        mockEstimationReturnValue = {
            calculateEstimatedSeconds: mockCalculateEstimatedSecondsFn,
        };

        require('@/hooks/useAudioConversion').useAudioConversion.mockReturnValue(mockAudioConversionReturnValue);
        require('../useTermsAndNotifications').useTermsAndNotifications.mockReturnValue(mockTermsReturnValue);
        require('../useChaptersDetection').useChaptersDetection.mockReturnValue(mockChaptersReturnValue);
        require('../useConversionEstimation').useConversionEstimation.mockReturnValue(mockEstimationReturnValue);
    });

    const getHookResult = () => {
        return renderHook(() => useConversionCore(
            mockSelectedFile,
            mockExtractedText,
            mockInitialChapters,
            mockOnStepComplete
        )).result;
    };

    it('should pass extractedText to useConversionEstimation', () => {
        getHookResult();
        expect(require('../useConversionEstimation').useConversionEstimation).toHaveBeenCalledWith(mockExtractedText);
    });

    it('exposes startAudioConversionProcess from audioConversion.executeTTSConversion', () => {
        const result = getHookResult();
        expect(result.current.startAudioConversionProcess).toBe(mockAudioConversionReturnValue.executeTTSConversion);
    });

    it('exposes term-related states and functions', () => {
        const result = getHookResult();
        expect(result.current.showTerms).toBe(mockTermsReturnValue.showTerms);
        expect(result.current.setShowTerms).toBe(mockTermsReturnValue.setShowTerms);
    });

    it('exposes chapter detection states and functions', () => {
        const result = getHookResult();
        expect(result.current.detectChapters).toBe(mockChaptersReturnValue.detectChapters);
        expect(result.current.setDetectChapters).toBe(mockChaptersReturnValue.setDetectChapters);
        expect(result.current.detectingChapters).toBe(mockChaptersReturnValue.detectingChapters);
    });

    it('exposes resetConversion from audioConversion.cancelConversion', () => {
        const result = getHookResult();
        expect(result.current.resetConversion).toBe(mockAudioConversionReturnValue.cancelConversion);
    });

    // Test for handleDownloadClick (currently a placeholder in useConversionCore)
    it('handleDownloadClick is defined (and is a placeholder as per current impl)', () => {
        const result = getHookResult();
        expect(result.current.handleDownloadClick).toBeDefined();
        act(() => {
            result.current.handleDownloadClick("test.mp3"); // Should call the wrapper which logs a warning
        });
        // Add console.warn spy if you want to assert the warning.
    });

    describe('Exposed Conversion State Values', () => {
        it('exposes conversionStatus correctly based on audioConversion state (idle)', () => {
            mockAudioConversionReturnValue.isConverting = false;
            mockAudioConversionReturnValue.error = null;
            mockAudioConversionReturnValue.conversionProgress = 0;
            const result = getHookResult();
            expect(result.current.conversionStatus).toBe('idle');
        });

        it('exposes conversionStatus correctly based on audioConversion state (converting)', () => {
            mockAudioConversionReturnValue.isConverting = true;
            mockAudioConversionReturnValue.error = null;
            const result = getHookResult();
            expect(result.current.conversionStatus).toBe('converting');
        });

        it('exposes conversionStatus correctly based on audioConversion state (error)', () => {
            mockAudioConversionReturnValue.isConverting = false;
            mockAudioConversionReturnValue.error = "TTS Error";
            const result = getHookResult();
            expect(result.current.conversionStatus).toBe('error');
        });

        it('exposes conversionStatus correctly based on audioConversion state (completed)', () => {
            mockAudioConversionReturnValue.isConverting = false;
            mockAudioConversionReturnValue.error = null;
            mockAudioConversionReturnValue.conversionProgress = 100;
            const result = getHookResult();
            expect(result.current.conversionStatus).toBe('completed');
        });

        it('exposes progress from audioConversion.conversionProgress', () => {
            mockAudioConversionReturnValue.conversionProgress = 75;
            const result = getHookResult();
            expect(result.current.progress).toBe(75);
        });

        // The following are placeholders in useConversionCore.ts as UseAudioConversionReturn doesn't expose them
        it('exposes audioData (placeholder null)', () => {
            const result = getHookResult();
            expect(result.current.audioData).toBeNull();
        });

        it('exposes conversionId (placeholder null)', () => {
            const result = getHookResult();
            expect(result.current.conversionId).toBeNull();
        });

        it('exposes elapsedTime (placeholder 0)', () => {
            const result = getHookResult();
            expect(result.current.elapsedTime).toBe(0);
        });
    });

    it('exposes calculateEstimatedSeconds from useConversionEstimation', () => {
        const result = getHookResult();
        expect(result.current.calculateEstimatedSeconds).toBe(mockEstimationReturnValue.calculateEstimatedSeconds);
        act(() => {
            result.current.calculateEstimatedSeconds();
        });
        expect(mockCalculateEstimatedSecondsFn).toHaveBeenCalled();
    });

    it('returns the correct value from calculateEstimatedSeconds', () => {
        const result = getHookResult();
        expect(result.current.calculateEstimatedSeconds()).toBe(120); // From mockCalculateEstimatedSecondsFn
    });

    it('exposes audioConversion object directly', () => {
        const result = getHookResult();
        expect(result.current.audioConversion).toBe(mockAudioConversionReturnValue);
    });
});
