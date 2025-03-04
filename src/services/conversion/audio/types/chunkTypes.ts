
import { TextChunkCallback } from '../../types/chunks';

export interface ProcessChunkResult {
  buffer: ArrayBuffer;
  index: number;
}

export interface ChunkProcessingContext {
  totalChunks: number;
  totalCharacters: number;
  onProgress?: TextChunkCallback;
}

export interface ChunkProgressUpdate {
  processedChunks: number;
  totalChunks: number;
  processedCharacters: number;
  totalCharacters: number;
  currentChunk: string | null;
  forceUpdate?: boolean;
}
