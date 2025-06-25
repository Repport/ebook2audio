
// Tipos del dominio central
export interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  startIndex: number;
  timestamp?: number;
  metadata?: {
    language?: string;
  };
  confidence?: number;
  type?: 'pattern' | 'style' | 'heading';
  content?: string;
}

export interface FileMetadata {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  hash?: string;
  totalCharacters: number;
  processedPages?: number;
  language?: string;
  chapters?: Chapter[];
}

export interface FileProcessingResult {
  text: string;
  metadata?: FileMetadata;
}
