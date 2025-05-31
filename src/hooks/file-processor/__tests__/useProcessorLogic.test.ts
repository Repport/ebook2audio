import { renderHook, act } from '@testing-library/react';
import { useProcessorLogic } from '../useProcessorLogic';
import {
    UseProcessorLogicReturn,
    UseToastReturn
} from '../../../types/hooks/processor';
import {
    Chapter,
    UseConversionCoreReturn,
    ConversionOptions,
    ConvertToAudioResult,
    TextChunkCallbackPlaceholder
} from '../../../types/hooks/conversion';
import { UseProcessorConversionReturn } from '../../../types/hooks/processor';


// Mock Composed Hooks
vi.mock('@/hooks/use-toast', () => ({ useToast: vi.fn() }));
vi.mock('../useProcessorUI', () => ({ useProcessorUI: vi.fn() }));
vi.mock('../useVoiceSettings', () => ({ useVoiceSettings: vi.fn() }));
vi.mock('../useConversionCore', () => ({ useConversionCore: vi.fn() }));
vi.mock('../useProcessorConversion', () => ({ useProcessorConversion: vi.fn() }));

describe('useProcessorLogic', () => {
    // Mock Functions & Return Values
    let mockToastFn: ReturnType<typeof vi.fn>;
    let mockSetActiveTabFn: ReturnType<typeof vi.fn>;
    let mockSetSelectedVoiceFn: ReturnType<typeof vi.fn>;
    let mockSetNotifyOnCompleteFn: ReturnType<typeof vi.fn>;
    let mockConversionCoreStartProcessFn: ReturnType<typeof vi.fn<any[], Promise<ConvertToAudioResult>>>;
    let mockConversionCoreResetFn: ReturnType<typeof vi.fn>;
    let mockConversionCoreSetShowTermsFn: ReturnType<typeof vi.fn>;
    let mockConversionCoreSetDetectChaptersFn: ReturnType<typeof vi.fn>;
    let mockProcessorConversionStartFn: ReturnType<typeof vi.fn<[], Promise<boolean>>>;
    let mockProcessorConversionTermsAcceptFn: ReturnType<typeof vi.fn<[any], Promise<void>>>;

    let mockUiReturn: { activeTab: string; setActiveTab: ReturnType<typeof vi.fn>; };
    let mockVoiceSettingsReturn: { selectedVoice: string; setSelectedVoice: ReturnType<typeof vi.fn>; notifyOnComplete: boolean; setNotifyOnComplete: ReturnType<typeof vi.fn>; };
    let mockConversionCoreReturn: UseConversionCoreReturn;
    let mockProcessorConversionReturn: UseProcessorConversionReturn;

    // Props for useProcessorLogic
    let mockSelectedFile: File | null;
    let mockExtractedText: string;
    let mockInitialChaptersProp: Chapter[]; // Renamed to avoid clash with state
    let mockOnFileSelectFn: ReturnType<typeof vi.fn>;
    let mockOnNextStepFn: ReturnType<typeof vi.fn>;
    let mockOnPreviousStepFn: ReturnType<typeof vi.fn>;
    let mockOnStepCompleteFn: ReturnType<typeof vi.fn>;

    let defaultProps: any; // Type will be ProcessorLogicProps defined inside the hook file

    beforeEach(() => {
        vi.resetAllMocks();

        // Init mock functions
        mockToastFn = vi.fn();
        mockSetActiveTabFn = vi.fn();
        mockSetSelectedVoiceFn = vi.fn();
        mockSetNotifyOnCompleteFn = vi.fn();
        mockConversionCoreStartProcessFn = vi.fn(async () => ({ audio: new ArrayBuffer(1), id: 'core-conv-id' }));
        mockConversionCoreResetFn = vi.fn();
        mockConversionCoreSetShowTermsFn = vi.fn();
        mockConversionCoreSetDetectChaptersFn = vi.fn();
        mockProcessorConversionStartFn = vi.fn(async () => true);
        mockProcessorConversionTermsAcceptFn = vi.fn(async () => {});

        // Setup mock returns for composed hooks
        require('@/hooks/use-toast').useToast.mockReturnValue({ toast: mockToastFn });

        mockUiReturn = { activeTab: 'file-info', setActiveTab: mockSetActiveTabFn };
        require('../useProcessorUI').useProcessorUI.mockReturnValue(mockUiReturn);

        mockVoiceSettingsReturn = {
            selectedVoice: 'voice1', setSelectedVoice: mockSetSelectedVoiceFn,
            notifyOnComplete: false, setNotifyOnComplete: mockSetNotifyOnCompleteFn
        };
        require('../useVoiceSettings').useVoiceSettings.mockReturnValue(mockVoiceSettingsReturn);

        mockConversionCoreReturn = {
            startAudioConversionProcess: mockConversionCoreStartProcessFn,
            resetConversion: mockConversionCoreResetFn,
            showTerms: false,
            setShowTerms: mockConversionCoreSetShowTermsFn,
            detectChapters: false,
            setDetectChapters: mockConversionCoreSetDetectChaptersFn,
            detectingChapters: false,
            conversionStatus: 'idle',
            progress: 0,
            audioData: null,
            conversionId: null,
            handleDownloadClick: vi.fn(),
            calculateEstimatedSeconds: vi.fn(() => 120),
            elapsedTime: 0,
            audioConversion: {} as any, // Mocked UseAudioConversionReturn if needed for deep tests
        };
        require('../useConversionCore').useConversionCore.mockReturnValue(mockConversionCoreReturn);

        mockProcessorConversionReturn = {
            handleStartConversion: mockProcessorConversionStartFn,
            handleTermsAccept: mockProcessorConversionTermsAcceptFn
        };
        require('../useProcessorConversion').useProcessorConversion.mockReturnValue(mockProcessorConversionReturn);

        // Props for useProcessorLogic
        mockSelectedFile = new File(['content'], 'test.txt', { type: 'text/plain' });
        mockExtractedText = 'Sample text for processing';
        mockInitialChaptersProp = [{ id: 'ch1', title: 'Chapter 1', startTime: 0, endTime: 10 }];
        mockOnFileSelectFn = vi.fn();
        mockOnNextStepFn = vi.fn();
        mockOnPreviousStepFn = vi.fn();
        mockOnStepCompleteFn = vi.fn();

        defaultProps = {
            selectedFile: mockSelectedFile,
            extractedText: mockExtractedText,
            chapters: mockInitialChaptersProp,
            onFileSelect: mockOnFileSelectFn,
            onNextStep: mockOnNextStepFn,
            onPreviousStep: mockOnPreviousStepFn,
            onStepComplete: mockOnStepCompleteFn,
            currentStep: 1, // Default currentStep
        };
    });

    const getHookResult = (propsOverride: Partial<any> = {}) => {
        return renderHook(() => useProcessorLogic({ ...defaultProps, ...propsOverride })).result;
    };

    it('calls useProcessorConversion with correct arguments', () => {
        getHookResult();
        const useProcessorConversionMock = require('../useProcessorConversion').useProcessorConversion;
        expect(useProcessorConversionMock).toHaveBeenCalledTimes(1);
        const passedProps = useProcessorConversionMock.mock.calls[0][0];

        expect(passedProps.selectedFile).toBe(mockSelectedFile);
        expect(passedProps.extractedText).toBe(mockExtractedText);
        expect(passedProps.chapters).toEqual(mockInitialChaptersProp); // Initial state of chapters
        expect(passedProps.selectedVoice).toBe(mockVoiceSettingsReturn.selectedVoice);
        expect(passedProps.notifyOnComplete).toBe(mockVoiceSettingsReturn.notifyOnComplete);
        expect(passedProps.currentStep).toBe(defaultProps.currentStep);
        expect(passedProps.showTerms).toBe(mockConversionCoreReturn.showTerms);
        expect(passedProps.setShowTerms).toBe(mockConversionCoreReturn.setShowTerms);
        expect(passedProps.onNextStep).toBe(mockOnNextStepFn);
        expect(passedProps.startAudioConversionProcess).toBe(mockConversionCoreReturn.startAudioConversionProcess);
        expect(passedProps.setIsProcessingGlobal).toEqual(expect.any(Function)); // The setIsProcessingNextStep setter
    });

    it('exposes states and functions from useProcessorUI', () => {
        const result = getHookResult();
        expect(result.current.activeTab).toBe(mockUiReturn.activeTab);
        expect(result.current.setActiveTab).toBe(mockUiReturn.setActiveTab);
    });

    it('exposes states/setters from useVoiceSettings', () => {
        const result = getHookResult();
        expect(result.current.selectedVoice).toBe(mockVoiceSettingsReturn.selectedVoice);
        expect(result.current.setSelectedVoice).toBe(mockVoiceSettingsReturn.setSelectedVoice);
        expect(result.current.notifyOnComplete).toBe(mockVoiceSettingsReturn.notifyOnComplete);
        expect(result.current.setNotifyOnComplete).toBe(mockVoiceSettingsReturn.setNotifyOnComplete);
    });

    it('exposes states/setters from conversionLogic (useConversionCore)', () => {
        const result = getHookResult();
        expect(result.current.showTerms).toBe(mockConversionCoreReturn.showTerms);
        expect(result.current.setShowTerms).toBe(mockConversionCoreReturn.setShowTerms);
        expect(result.current.detectChapters).toBe(mockConversionCoreReturn.detectChapters);
        expect(result.current.setDetectChapters).toBe(mockConversionCoreReturn.setDetectChapters);
        expect(result.current.detectingChapters).toBe(mockConversionCoreReturn.detectingChapters);
        expect(result.current.resetConversion).toBe(mockConversionCoreReturn.resetConversion);
        expect(result.current.conversionLogic).toBe(mockConversionCoreReturn); // Exposes the whole object
    });

    it('exposes handleStartConversion and handleTermsAccept from useProcessorConversion', () => {
        const result = getHookResult();
        expect(result.current.handleStartConversion).toBe(mockProcessorConversionReturn.handleStartConversion);
        expect(result.current.handleTermsAccept).toBe(mockProcessorConversionReturn.handleTermsAccept);
    });

    it('exposes toast function', () => {
        const result = getHookResult();
        expect(result.current.toast).toBe(mockToastFn);
    });

    it('exposes its own isProcessingNextStep state and updates it via setIsProcessingGlobal passed to useProcessorConversion', () => {
        const { result, rerender } = renderHook((props) => useProcessorLogic(props), { initialProps: defaultProps });
        expect(result.current.isProcessingNextStep).toBe(false); // Initial state

        // Simulate setIsProcessingGlobal being called by useProcessorConversion
        const useProcessorConversionMock = require('../useProcessorConversion').useProcessorConversion;
        const passedPropsToConversionHook = useProcessorConversionMock.mock.calls[0][0];

        act(() => {
            passedPropsToConversionHook.setIsProcessingGlobal(true);
        });
        // Rerender might not be needed if state update is synchronous and picked up
        // but let's ensure the hook re-evaluates if state changes.
        // For this test, we are checking the value of isProcessingNextStep which is managed by useState
        // The act() call ensures state updates are flushed.
        expect(result.current.isProcessingNextStep).toBe(true);

        act(() => {
            passedPropsToConversionHook.setIsProcessingGlobal(false);
        });
        expect(result.current.isProcessingNextStep).toBe(false);
    });

    describe('handleGoBack Logic', () => {
        it('currentStep > 1, not converting/detecting, calls onPreviousStep', () => {
            mockConversionCoreReturn.conversionStatus = 'idle';
            mockConversionCoreReturn.detectingChapters = false;
            const result = getHookResult({ currentStep: 2 });

            act(() => { result.current.handleGoBack(); });

            expect(mockOnPreviousStepFn).toHaveBeenCalledTimes(1);
            expect(mockOnFileSelectFn).not.toHaveBeenCalled();
            expect(mockConversionCoreResetFn).not.toHaveBeenCalled();
        });

        it('currentStep === 1, not converting/detecting, calls onFileSelect(null) and resetConversion', () => {
            mockConversionCoreReturn.conversionStatus = 'idle';
            mockConversionCoreReturn.detectingChapters = false;
            const result = getHookResult({ currentStep: 1 });

            act(() => { result.current.handleGoBack(); });

            expect(mockOnPreviousStepFn).not.toHaveBeenCalled();
            expect(mockOnFileSelectFn).toHaveBeenCalledWith(null);
            expect(mockConversionCoreResetFn).toHaveBeenCalledTimes(1);
        });

        it('Actively converting, calls toast and does not navigate', () => {
            mockConversionCoreReturn.conversionStatus = 'converting';
            const result = getHookResult({ currentStep: 2 });

            act(() => { result.current.handleGoBack(); });

            expect(mockOnPreviousStepFn).not.toHaveBeenCalled();
            expect(mockOnFileSelectFn).not.toHaveBeenCalled();
            expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
                title: "In Progress",
            }));
        });

        it('Detecting chapters, calls toast and does not navigate', () => {
            mockConversionCoreReturn.detectingChapters = true;
            const result = getHookResult({ currentStep: 2 });

            act(() => { result.current.handleGoBack(); });

            expect(mockOnPreviousStepFn).not.toHaveBeenCalled();
            expect(mockOnFileSelectFn).not.toHaveBeenCalled();
            expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
                title: "In Progress",
            }));
        });

        it('isProcessingNextStep is true, calls toast and does not navigate', () => {
            const { result } = renderHook((props) => useProcessorLogic(props), { initialProps: defaultProps });
            act(() => {
                 require('../useProcessorConversion').useProcessorConversion.mock.calls[0][0].setIsProcessingGlobal(true);
            });

            act(() => { result.current.handleGoBack(); });

            expect(mockOnPreviousStepFn).not.toHaveBeenCalled();
            expect(mockOnFileSelectFn).not.toHaveBeenCalled();
            expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
                title: "In Progress",
            }));
        });
    });
});
