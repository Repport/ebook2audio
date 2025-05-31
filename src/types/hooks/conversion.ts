// Placeholder for Chapter interface (assuming it will be defined elsewhere)
// import { Chapter } from '../models'; // Or wherever Chapter is defined

export interface ConversionServiceResult {
  // Placeholder for now
  success: boolean;
  message?: string;
  data?: any; // Replace 'any' with a more specific type if available
}

export interface UseAudioStateReturn {
  isAudioPlaying: boolean;
  currentAudioTime: number;
  audioDuration: number;
  audioPlaybackRate: number;
  playAudio: () => void;
  pauseAudio: () => void;
  setAudioTime: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  isLoading: boolean; // Added isLoading based on typical audio player states
  error: string | null; // Added error state
}

export interface ConversionOptions {
  trimmingEnabled?: boolean;
  startTime?: number;
  endTime?: number;
  removeSilence?: boolean;
  normalizeAudio?: boolean;
  customBitrate?: number; // e.g., 128, 192, 256
  // Add other relevant conversion options here
  selectedVoice: string;
  notifyOnComplete?: boolean;
}

export interface UseConversionActionsArgs {
  audioRef: React.RefObject<HTMLAudioElement>;
  setConversionOptions: (options: ConversionOptions) => void;
  currentFile?: File; // Or string for URL
  // Add other arguments as needed
}

export interface UseConversionActionsReturn {
  handleTrim: (startTime: number, endTime: number) => void;
  handleRemoveSilence: () => void;
  handleNormalizeAudio: () => void;
  handleSetCustomBitrate: (bitrate: number) => void;
  applyConversionOptions: (options: ConversionOptions) => void;
  // Add other actions as needed
}

// Assuming Chapter is defined, e.g., in a file like src/types/models.ts
// For now, a placeholder:
export interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
}


export interface UseAudioConversionReturn {
  isConverting: boolean;
  conversionProgress: number;
  convertedFileUrl: string | null;
  error: string | null;
  startConversion: (file: File, options: ConversionOptions) => Promise<ConversionServiceResult>;
  cancelConversion: () => void;
  convertedChapters?: Chapter[]; // Optional: if chapter generation is part of conversion
  executeTTSConversion: (
    text: string,
    voiceId: string,
    chapters?: Chapter[],
    fileName?: string,
    onProgress?: TextChunkCallbackPlaceholder
  ) => Promise<ConvertToAudioResult>;
}

export interface UseConversionCoreReturn {
  // Core audio conversion functionality (can be kept if direct access is still desired)
  audioConversion: UseAudioConversionReturn;

  // TTS focused operations
  startAudioConversionProcess: (
    text: string,
    voiceId: string,
    chapters?: Chapter[],
    fileName?: string,
    onProgress?: TextChunkCallbackPlaceholder
  ) => Promise<ConvertToAudioResult>;

  // Terms and conditions
  showTerms: boolean;
  setShowTerms: (show: boolean) => void;

  // Chapter detection
  detectChapters: boolean;
  setDetectChapters: (detect: boolean) => void;
  detectingChapters: boolean; // State for chapter detection process

  // Conversion lifecycle and state
  resetConversion: () => void;
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  audioData: ArrayBuffer | null;
  conversionId: string | null;
  elapsedTime: number;

  // Utilities
  handleDownloadClick: (fileName: string) => void; // fileName here is for the downloaded file, audioData comes from state
  calculateEstimatedSeconds: () => number;
}

export interface UseAudioConversionProcessStateReturn {
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error';
  setConversionStatus: (status: 'idle' | 'converting' | 'completed' | 'error') => void;
  progress: number;
  setProgress: (newProgress: number) => void;
  audioData: ArrayBuffer | null;
  setAudioData: (data: ArrayBuffer | null) => void;
  audioDuration: number;
  setAudioDuration: (duration: number) => void;
  conversionId: string | null;
  setConversionId: (id: string | null) => void;
  currentFileName: string | null;
  setCurrentFileName: (fileName: string | null) => void;
  elapsedTime: number;
  setElapsedTime: (time: number) => void;
  conversionStartTime: number | undefined;
  setConversionStartTime: (time: number | undefined) => void;
}

// Matches the actual return type of services/conversion/convertToAudio
export interface ConvertToAudioResult {
  audio: ArrayBuffer | null;
  id?: string;
  error?: string;
  // Add any other fields that convertToAudio might return
}

// Interface for the onProgress callback based on TextChunkCallback
// import { TextChunkCallback } from '@/services/conversion/types/chunks';
// Assuming TextChunkCallback is: (chunk: { text: string;
//                                         timestamp: number;
//                                         isFirstChunk: boolean;
//                                         isLastChunk: boolean; }) => void
// For now, let's define a placeholder if not readily available
type TextChunkCallbackPlaceholder = (chunk: { text: string; timestamp: number; isFirstChunk: boolean; isLastChunk: boolean; }) => void;


export interface UseAudioConversionActionsReturn {
  resetConversion: () => void;
  handleConversion: (
    text: string,
    voiceId: string,
    onProgress?: TextChunkCallbackPlaceholder, // Use the actual TextChunkCallback type if available
    chapters?: Chapter[], // Chapter should be imported or defined
    fileName?: string
  ) => Promise<ConvertToAudioResult>; // Use a more specific return type
  handleDownload: (fileName: string, audioData: ArrayBuffer | null) => void;
}
