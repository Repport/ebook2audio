
export interface AudioResponse {
  data: {
    audioContent: string;
  };
}

export interface ChunkProcessingOptions {
  voiceId: string;
  fileName?: string;
  conversionId: string;
  totalChunks: number;
  totalCharacters: number;
}

export type TextChunkCallback = (
  chunkText: string,
  processedCharacters: number,
  totalCharacters: number
) => void;
