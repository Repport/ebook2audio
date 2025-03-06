
import { ConversionState } from '../types';

// Esto tiene que estar fuera de la función para mantenerlo entre renders
const debounceState = {
  lastUpdateTime: 0,
  lastElapsedTime: 0,
  lastTimeRemaining: undefined
};

export const updateElapsedTimeAction = (
  set: (state: Partial<ConversionState>) => void,
  get: () => any
) => {
  const MIN_UPDATE_INTERVAL = 1000; // msec - incrementado para reducir actualizaciones
  
  const updateElapsedTime = (elapsedSeconds: number, startTime: number) => {
    const currentState = get();
    
    // No actualizar si el estado no está en conversión o procesamiento
    if (currentState.status !== 'converting' && currentState.status !== 'processing') {
      return;
    }
    
    // Debounce - solo actualizar si hay un cambio significativo o ha pasado suficiente tiempo
    const now = Date.now();
    const timeElapsed = now - debounceState.lastUpdateTime;
    const secondsDiff = Math.abs(elapsedSeconds - debounceState.lastElapsedTime);
    
    // Previene actualizaciones demasiado frecuentes
    if (timeElapsed < MIN_UPDATE_INTERVAL && secondsDiff < 2) {
      return;
    }
    
    // Calcular tiempo restante basado en progreso y tiempo transcurrido
    let timeRemaining: number | null = null;
    
    if (currentState.progress > 5 && elapsedSeconds > 5) {
      // Proyección lineal simple
      const estimatedTotalSeconds = (elapsedSeconds / currentState.progress) * 100;
      timeRemaining = Math.max(1, estimatedTotalSeconds - elapsedSeconds);
    }
    
    // Omitir la actualización si el tiempo restante no ha cambiado significativamente
    if (
      typeof timeRemaining === 'number' && 
      typeof debounceState.lastTimeRemaining === 'number' && 
      Math.abs(timeRemaining - debounceState.lastTimeRemaining) < 2 &&
      timeElapsed < MIN_UPDATE_INTERVAL * 2
    ) {
      return;
    }
    
    // Actualizar variables de seguimiento
    debounceState.lastUpdateTime = now;
    debounceState.lastElapsedTime = elapsedSeconds;
    debounceState.lastTimeRemaining = timeRemaining;
    
    // Actualización por lotes para minimizar renders
    set({
      time: {
        elapsed: elapsedSeconds,
        startTime,
        remaining: timeRemaining
      }
    });
  };

  return { updateElapsedTime };
};
