
export interface TextChunkInfo {
  processedChunks: number;
  totalChunks: number;
  processedCharacters: number;
  totalCharacters: number;
  currentChunk?: string;
  error?: string;
  warning?: string;
}

export type TextChunkCallback = (info: TextChunkInfo) => void;
