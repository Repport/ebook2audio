
export type ConversionStatus = 'idle' | 'converting' | 'completed' | 'error' | 'processing';

export interface ConversionChunksState {
  processed: number;
  total: number;
  processedCharacters: number;
  totalCharacters: number;
}

export interface ConversionTimeState {
  elapsed: number;
  remaining: number | null;
  startTime: number | null;
}

export interface ConversionState {
  // Estado general
  status: ConversionStatus;
  progress: number;
  
  // Información de chunks
  chunks: ConversionChunksState;
  
  // Tiempo
  time: ConversionTimeState;
  
  // Errores y advertencias
  errors: string[];
  warnings: string[];
  
  // Resultado
  audioData: ArrayBuffer | null;
  audioDuration: number;
  conversionId: string | null;
  fileName: string | null;
}

export interface ConversionActions {
  startConversion: (fileName: string | null) => void;
  updateProgress: (data: import('@/services/conversion/types/chunks').ChunkProgressData) => void;
  setError: (error: string) => void;
  setWarning: (warning: string) => void;
  completeConversion: (audio: ArrayBuffer, id: string, duration: number) => void;
  resetConversion: () => void;
  updateElapsedTime: (elapsed: number, startTime: number) => void;
}

export type ConversionStore = ConversionState & ConversionActions;
