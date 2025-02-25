
export interface AudioResponse {
  data: {
    audioContent: string;
  };
}

export interface ChunkProgressData {
  processedChunks: number;
  totalChunks: number;
  processedCharacters: number;
  totalCharacters: number;
  currentChunk: string;
  error?: string;
  warning?: string;
  progress?: number;
  isCompleted?: boolean; // Añadimos esta propiedad para indicar finalización
}

export interface ChunkProcessingOptions {
  voiceId: string;
  fileName?: string;
  conversionId: string;
  totalChunks: number;
  totalCharacters: number;
}

export type TextChunkCallback = (data: ChunkProgressData) => void;
