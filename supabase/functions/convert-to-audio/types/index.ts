
export interface ConversionRequest {
  text: string;
  voiceId: string;
  fileName?: string;
  conversionId?: string;
  isChunk?: boolean;
  chunkIndex?: number;
  totalChunks?: number;
}

export interface ConversionResponse {
  data: {
    audioContent: string;
    progress: number;
    processingTime?: number;
    chunkIndex?: number;
    totalChunks?: number;
    characterCount?: number;
  };
}

export interface ErrorResponse {
  error: string;
  details?: string;
  timestamp: string;
  requestId?: string;
}
