
export interface ConversionRequest {
  text: string;
  voiceId: string;
  fileName?: string;
  conversionId?: string;
  isChunk?: boolean;
  chunkIndex?: number;
}

export interface ConversionResponse {
  data: {
    audioContent: string;
    progress: number;
  };
}

export interface ErrorResponse {
  error: string;
  details?: string;
  timestamp: string;
}
