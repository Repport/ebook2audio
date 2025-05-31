import {
  Chapter,
  ConversionOptions,
  UseConversionCoreReturn,
  ConvertToAudioResult,
  TextChunkCallbackPlaceholder
} from './conversion';

// Defined first as it's used by UseProcessorLogicReturn
export interface UseToastReturn {
  toast: (options: {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success' | 'warning';
    duration?: number;
  }) => void;
}

export interface UseProcessorConversionProps {
  selectedFile: File | null;
  extractedText: string;
  chapters: Chapter[];
  selectedVoice: string;
  notifyOnComplete: boolean;
  currentStep: number;
  showTerms: boolean;
  setShowTerms: (show: boolean) => void;
  onNextStep: () => void;
  // Pass the actual function that starts the TTS audio conversion
  startAudioConversionProcess: (
    text: string,
    voiceId: string,
    chapters?: Chapter[],
    fileName?: string,
    onProgress?: TextChunkCallbackPlaceholder
  ) => Promise<ConvertToAudioResult>;
  // Pass the setter for the parent's processing flag
  setIsProcessingGlobal: (isProcessing: boolean) => void;
}

export interface UseProcessorConversionReturn {
  handleStartConversion: () => Promise<boolean>; // Manages pre-checks and terms UI
  handleTermsAccept: (options: { selectedVoice: string; notifyOnComplete: boolean; }) => Promise<void>; // Called after terms are accepted by UI
}

// Note: ProcessorLogicProps (for the hook's arguments) is defined locally in useProcessorLogic.ts
// This UseProcessorLogicReturn is for the hook's return value.
export interface UseProcessorLogicReturn {
  // From props or local state
  selectedFile: File | null;
  extractedText: string;
  chapters: Chapter[]; // Current chapters state within useProcessorLogic

  // UI State from useProcessorUI
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Voice Settings from useVoiceSettings
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  notifyOnComplete: boolean;
  setNotifyOnComplete: (notify: boolean) => void;

  // Processing Flag
  isProcessingNextStep: boolean; // UI feedback flag, should be controlled by this hook

  // Core Conversion Logic (already correctly typed)
  conversionLogic: UseConversionCoreReturn;

  // Terms state (convenience access from conversionLogic)
  showTerms: boolean;
  setShowTerms: (show: boolean) => void;

  // Chapter Detection state (convenience access from conversionLogic)
  detectChapters: boolean;
  setDetectChapters: (detect: boolean) => void;
  detectingChapters: boolean;

  // Actions
  handleStartConversion: () => Promise<boolean>; // From useProcessorConversion
  handleTermsAccept: (options: { selectedVoice: string; notifyOnComplete: boolean; }) => Promise<void>; // From useProcessorConversion
  handleGoBack: () => void;
  resetConversion: () => void; // From conversionLogic

  // Utilities
  toast: UseToastReturn['toast'];
}

// The minimal ProcessorLogicProps that was in this file previously is removed
// as the main props for the useProcessorLogic hook are defined in its own file.
// The UseProcessorLogicReturn interface is the key definition from this file for that hook.
// If there was a `ProcessorLogicProps` here for the return type, it's superseded by `UseProcessorLogicReturn`.
// Also removing UseProcessorConversionProps from previous version if it was minimal and different
// and ProcessorLogicType (old name for UseProcessorLogicReturn).
