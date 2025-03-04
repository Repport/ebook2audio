
export interface ChunkProgressData {
  processedChunks: number;
  totalChunks: number;
  processedCharacters: number;
  totalCharacters: number;
  currentChunk: string;
  progress: number;
  error?: string;
  warning?: string;
  isCompleted?: boolean;
}

export type TextChunkCallback = (progressData: ChunkProgressData) => void;

export interface ProgressSubscription {
  unsubscribe: () => void;
}

// Add the audio response type that was missing
export interface AudioResponse {
  audioContent: string;
  duration?: number;
  format?: string;
  sampleRate?: number;
  processingTime?: number;
  progress?: number;
  error?: string;
}

// Add the chunk processing options type that was missing
export interface ChunkProcessingOptions {
  maxParallelChunks?: number;
  retryDelayMs?: number;
  maxRetries?: number;
  timeout?: number;
  progressCallback?: TextChunkCallback;
}
