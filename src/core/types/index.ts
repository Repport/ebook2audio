
// Tipos centrales del dominio
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

export interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  content?: string;
}

export interface FileMetadata {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  hash?: string;
}
