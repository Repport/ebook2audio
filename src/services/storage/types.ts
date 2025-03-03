
export interface StoredConversionState {
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  audioData?: string; // base64
  audioDuration: number;
  fileName?: string;
  conversionId?: string;
  conversionStartTime?: number; // Timestamp cuando empezó la conversión
  elapsedTime?: number; // Tiempo transcurrido en segundos
}
