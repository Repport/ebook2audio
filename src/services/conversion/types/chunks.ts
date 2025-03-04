
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
