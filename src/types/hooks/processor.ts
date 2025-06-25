
import {
  Chapter,
  ConversionOptions,
  UseConversionCoreReturn,
  ConvertToAudioResult,
  TextChunkCallback
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
  startAudioConversionProcess: (
    text: string,
    voiceId: string,
    chapters?: Chapter[],
    fileName?: string,
    onProgress?: TextChunkCallback
  ) => Promise<ConvertToAudioResult>;
  setIsProcessingGlobal: (isProcessing: boolean) => void;
}

export interface UseProcessorConversionReturn {
  handleStartConversion: () => Promise<boolean>;
  handleTermsAccept: (options: { selectedVoice: string; notifyOnComplete: boolean; }) => Promise<void>;
}

export interface UseProcessorLogicReturn {
  // From props or local state
  selectedFile: File | null;
  extractedText: string;
  chapters: Chapter[];

  // UI State from useProcessorUI
  activeTab: string;
  setActiveTab: (tab: string) => void;
  goToNextTab: () => void; // Added this missing property

  // Voice Settings from useVoiceSettings
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  notifyOnComplete: boolean;
  setNotifyOnComplete: (notify: boolean) => void;

  // Processing Flag
  isProcessingNextStep: boolean;

  // Core Conversion Logic
  conversionLogic: UseConversionCoreReturn;

  // Terms state (convenience access from conversionLogic)
  showTerms: boolean;
  setShowTerms: (show: boolean) => void;

  // Chapter Detection state (convenience access from conversionLogic)
  detectChapters: boolean;
  setDetectChapters: (detect: boolean) => void;
  detectingChapters: boolean;

  // Actions
  handleStartConversion: () => Promise<boolean>;
  handleTermsAccept: (options: { selectedVoice: string; notifyOnComplete: boolean; }) => Promise<void>;
  handleGoBack: () => void;
  resetConversion: () => void;

  // Utilities
  toast: UseToastReturn['toast'];
}
