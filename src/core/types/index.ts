
// Tipos centrales del dominio
export * from './domain';

export interface ConversionRequest {
  id: string;
  text: string;
  voiceId: string;
  fileName?: string;
  options?: ConversionOptions;
}

export interface ConversionOptions {
  detectChapters?: boolean;
  notifyOnComplete?: boolean;
  chunkSize?: number;
  selectedVoice?: string;
}

export interface ConversionResult {
  id: string;
  audio: ArrayBuffer;
  duration?: number;
  metadata?: ConversionMetadata;
}

export interface ConversionMetadata {
  totalChunks: number;
  processedChunks: number;
  processingTime: number;
  audioSize: number;
}

export interface ProcessingProgress {
  conversionId: string;
  processedChunks: number;
  totalChunks: number;
  processedCharacters: number;
  totalCharacters: number;
  progress: number;
  currentChunk?: string;
  error?: string;
  warning?: string;
  isCompleted?: boolean;
}
