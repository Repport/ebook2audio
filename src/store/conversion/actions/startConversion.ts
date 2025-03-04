
import { ConversionState } from '../types';
import { initialState } from '../initialState';

export const startConversionAction = (
  set: (state: Partial<ConversionState>) => void,
  get: () => any,
  LoggingService: any
) => (fileName: string | null) => {
  // Before starting a new conversion, check if we need to reset
  const currentState = get();
  const needsReset = currentState.status !== 'idle' && currentState.status !== 'converting';
  
  if (needsReset) {
    console.log('ConversionStore: Resetting state before starting new conversion');
    // Reset first to avoid state conflicts
    set(initialState);
  }
  
  console.log(`ConversionStore: Starting conversion for file: ${fileName || 'unnamed'}`);
  
  // Limpiamos logs de debug anteriores
  try {
    localStorage.setItem('conversionProgressLogs', '[]');
  } catch (e) {
    // Ignorar errores
  }
  
  // Set to converting state with minimal initial values
  set({
    status: 'converting',
    progress: 1, // Comenzar con 1% visible
    chunks: {
      processed: 0,
      total: 0,
      processedCharacters: 0,
      totalCharacters: 0
    },
    time: {
      elapsed: 0,
      remaining: null,
      startTime: Date.now()
    },
    errors: [],
    warnings: [],
    audioData: null,
    fileName
  });
  
  // Log inicio de conversión
  LoggingService.info('conversion', {
    message: 'Iniciando conversión de texto a audio',
    file_name: fileName
  });
};
