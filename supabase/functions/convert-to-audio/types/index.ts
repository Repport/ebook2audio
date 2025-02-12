
export interface ConversionRequest {
  text: string;
  voiceId: string;
  fileName?: string;
  conversionId: string;
}

export interface ConversionResponse {
  data: {
    audioContent: string;
    id: string;
    progress: number;
  };
}

export interface ErrorResponse {
  error: string;
  details?: string;
  timestamp: string;
}
