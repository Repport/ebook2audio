
import { ConversionState } from '../types';
import { initialState } from '../initialState';

export const completionResetActions = (
  set: (state: Partial<ConversionState>) => void,
  get: () => any,
  LoggingService: any
) => {
  // Completar conversión
  const completeConversion = (audio: ArrayBuffer | null, id: string | null, duration: number) => {
    console.log(`ConversionStore: Completing conversion:`, {
      id,
      duration: `${duration}s`,
      audioSize: audio ? `${(audio.byteLength / 1024).toFixed(2)} KB` : 'none'
    });
    
    set({
      status: 'completed',
      progress: 100,
      audioData: audio,
      conversionId: id,
      audioDuration: duration
    });
    
    // Log completion
    LoggingService.info('conversion', {
      message: 'Conversión completada exitosamente',
      audio_size: audio ? audio.byteLength : 0,
      duration,
      id
    });
  };
  
  // Resetear conversión
  const resetConversion = () => {
    console.log('ConversionStore: Resetting conversion state');
    set(initialState);
  };

  return { completeConversion, resetConversion };
};
