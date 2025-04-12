
export interface ConversionState {
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  audioData: ArrayBuffer | null;
  error: string | null;
  fileName: string | null;
}

export interface ConversionProgress {
  progress: number;
  processedChunks?: number;
  totalChunks?: number;
  processedCharacters?: number;
  totalCharacters?: number;
  currentChunk?: string;
  error?: string;
  warning?: string;
}

export interface ConversionResult {
  audio: ArrayBuffer;
  id: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  preview?: string;
}

export interface ExtractedChapter {
  title: string;
  content: string;
  id: string;
  level?: number;
}
