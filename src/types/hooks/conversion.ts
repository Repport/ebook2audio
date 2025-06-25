
import { Chapter } from '../../core/types/domain';

export { Chapter };

export interface ConversionServiceResult {
  success: boolean;
  message?: string;
  data?: any;
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
  isLoading: boolean;
  error: string | null;
}

export interface ConversionOptions {
  selectedVoice: string;
  notifyOnComplete?: boolean;
  trimmingEnabled?: boolean;
  startTime?: number;
  endTime?: number;
  removeSilence?: boolean;
  normalizeAudio?: boolean;
  customBitrate?: number;
}

export interface UseConversionActionsArgs {
  audioRef: React.RefObject<HTMLAudioElement>;
  setConversionOptions: (options: ConversionOptions) => void;
  currentFile?: File;
}

export interface UseConversionActionsReturn {
  handleTrim: (startTime: number, endTime: number) => void;
  handleRemoveSilence: () => void;
  handleNormalizeAudio: () => void;
  handleSetCustomBitrate: (bitrate: number) => void;
  applyConversionOptions: (options: ConversionOptions) => void;
}

export interface ConvertToAudioResult {
  audio: ArrayBuffer | null;
  id?: string;
  error?: string;
}

export type TextChunkCallback = (chunk: {
  text: string;
  timestamp: number;
  isFirstChunk: boolean;
  isLastChunk: boolean;
  progress?: number;
  processedCharacters?: number;
  totalCharacters?: number;
  currentChunk?: string;
}) => void;

export interface UseAudioConversionReturn {
  isConverting: boolean;
  conversionProgress: number;
  convertedFileUrl: string | null;
  error: string | null;
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  audioData: ArrayBuffer | null;
  audioDuration: number;
  conversionId: string | null;
  elapsedTime: number;
  startConversion: (file: File, options: ConversionOptions) => Promise<ConversionServiceResult>;
  cancelConversion: () => void;
  convertedChapters?: Chapter[];
  executeTTSConversion: (
    text: string,
    voiceId: string,
    chapters?: Chapter[],
    fileName?: string,
    onProgress?: TextChunkCallback
  ) => Promise<ConvertToAudioResult>;
  handleConversion: (
    text: string,
    voiceId: string,
    onProgress?: TextChunkCallback,
    chapters?: Chapter[],
    fileName?: string
  ) => Promise<ConvertToAudioResult>;
  handleDownload: (fileName: string) => void;
  resetConversion: () => void;
  setProgress: (progress: number) => void;
  setConversionStatus: (status: 'idle' | 'converting' | 'completed' | 'error') => void;
}

export interface UseConversionCoreReturn {
  audioConversion: UseAudioConversionReturn;
  startAudioConversionProcess: (
    text: string,
    voiceId: string,
    chapters?: Chapter[],
    fileName?: string,
    onProgress?: TextChunkCallback
  ) => Promise<ConvertToAudioResult>;
  showTerms: boolean;
  setShowTerms: (show: boolean) => void;
  detectChapters: boolean;
  setDetectChapters: (detect: boolean) => void;
  detectingChapters: boolean;
  resetConversion: () => void;
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  audioData: ArrayBuffer | null;
  conversionId: string | null;
  elapsedTime: number;
  handleDownloadClick: (fileName: string) => void;
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

export interface UseAudioConversionActionsReturn {
  resetConversion: () => void;
  handleConversion: (
    text: string,
    voiceId: string,
    onProgress?: TextChunkCallback,
    chapters?: Chapter[],
    fileName?: string
  ) => Promise<ConvertToAudioResult>;
  handleDownload: (fileName: string, audioData: ArrayBuffer | null) => void;
}
