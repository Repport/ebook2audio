
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

// Audio response type 
export interface AudioResponse {
  audioContent: string;
  data?: any; // Added data property to fix TypeScript errors
  duration?: number;
  format?: string;
  sampleRate?: number;
  processingTime?: number;
  progress?: number;
  error?: string;
}

// Enhanced chunk processing options
export interface ChunkProcessingOptions {
  maxParallelChunks?: number;
  retryDelayMs?: number;
  maxRetries?: number;
  timeout?: number;
  progressCallback?: TextChunkCallback;
  
  // Additional properties needed by batchProcessor
  voiceId?: string;
  fileName?: string;
  conversionId?: string;
  totalChunks?: number;
  totalCharacters?: number;
}
