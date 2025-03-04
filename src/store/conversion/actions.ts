
import { ConversionState, ConversionActions } from './types';
import { initialState } from './initialState';
import { calculateTimeRemaining } from './utils';
import { ChunkProgressData } from '@/services/conversion/types/chunks';
import { LoggingService } from '@/utils/loggingService';

export const createConversionActions = (
  set: (state: Partial<ConversionState>) => void,
  get: () => any // Using any here to avoid circular reference issues
): ConversionActions => ({
  // Acción para iniciar la conversión
  startConversion: (fileName) => {
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
  },
  
  // Actualizar progreso basado en datos del chunk
  updateProgress: (data: ChunkProgressData) => {
    // Obtener estado actual
    const state = get();
    
    // If status is completed or error, don't update progress to avoid loops
    if (state.status === 'completed' || state.status === 'error') {
      console.log('ConversionStore: Ignoring progress update, conversion already completed or failed');
      return;
    }
    
    // Log data ANTES de cualquier validación para debug
    console.log(`ConversionStore [RAW]: Progress update received:`, {
      rawData: JSON.stringify(data),
      currentStatus: state.status
    });
    
    // Create new sets to avoid modifying existing state arrays
    const uniqueErrors = new Set<string>(state.errors);
    const uniqueWarnings = new Set<string>(state.warnings);
    
    // Manejar errores y advertencias
    if (data.error && typeof data.error === 'string' && data.error.trim() !== '') {
      uniqueErrors.add(data.error);
    }
    
    if (data.warning && typeof data.warning === 'string' && data.warning.trim() !== '') {
      uniqueWarnings.add(data.warning);
    }
    
    // VALIDACIONES CRÍTICAS: verificar que tenemos todos los datos necesarios
    const hasValidChunksData = typeof data.processedChunks === 'number' && 
                              typeof data.totalChunks === 'number' && 
                              data.totalChunks > 0;
                              
    const hasValidCharData = typeof data.processedCharacters === 'number' && 
                            typeof data.totalCharacters === 'number' && 
                            data.totalCharacters > 0;
    
    const hasExplicitProgress = typeof data.progress === 'number' && 
                               !isNaN(data.progress) && 
                               data.progress >= 0;
    
    // Si no hay datos válidos pero no es un error, hacemos log pero continuamos
    if (!hasValidChunksData && !hasValidCharData && !hasExplicitProgress && !data.error) {
      console.warn('ConversionStore: Received update with insufficient data:', data);
      
      // Si no hay datos pero tenemos isCompleted, podemos procesar el evento final
      if (data.isCompleted !== true) {
        return; // Ignoramos actualizaciones sin datos suficientes
      }
    }
    
    // RESOLUCIÓN DE DATOS: priorizar los datos nuevos, pero mantener los existentes si no hay nuevos
    
    // 1. Datos de chunks
    const updatedChunks = {
      processed: hasValidChunksData ? data.processedChunks : state.chunks.processed,
      total: hasValidChunksData ? data.totalChunks : state.chunks.total,
      processedCharacters: hasValidCharData ? data.processedCharacters : state.chunks.processedCharacters,
      totalCharacters: hasValidCharData ? data.totalCharacters : state.chunks.totalCharacters
    };
    
    // 2. Calcular el progreso - usar la estrategia más fiable disponible
    let newProgress = state.progress;
    let progressSource = 'existing';
    
    // Prioridad 1: Progreso explícito
    if (hasExplicitProgress) {
      newProgress = Math.min(99, data.progress);
      progressSource = 'explicit';
    } 
    // Prioridad 2: Cálculo basado en caracteres procesados
    else if (hasValidCharData && updatedChunks.totalCharacters > 0) {
      const calculatedProgress = Math.round((updatedChunks.processedCharacters / updatedChunks.totalCharacters) * 100);
      newProgress = Math.min(99, calculatedProgress);
      progressSource = 'characters';
    }
    // Prioridad 3: Cálculo basado en chunks procesados
    else if (hasValidChunksData && updatedChunks.total > 0) {
      const calculatedProgress = Math.round((updatedChunks.processed / updatedChunks.total) * 100);
      newProgress = Math.min(99, calculatedProgress);
      progressSource = 'chunks';
    }
    
    // Asegurar que el progreso siempre avance (nunca retroceda)
    // Excepción: si hay un cambio muy grande (>10%), aceptarlo (podría ser una corrección)
    if (newProgress < state.progress && Math.abs(newProgress - state.progress) < 10 && !data.isCompleted) {
      console.log(`ConversionStore: Progress regression detected (${newProgress}% < ${state.progress}%), keeping current progress`);
      newProgress = state.progress;
    }
    
    // Verificar si la conversión está completa
    const isComplete = data.isCompleted === true || newProgress >= 100;
    const finalProgress = isComplete ? 100 : newProgress;
    
    // Calcular tiempo restante si no está completado
    let timeRemaining = state.time.remaining;
    
    if (!isComplete && state.time.elapsed > 5 && newProgress > 5) {
      timeRemaining = calculateTimeRemaining(
        state.time.elapsed,
        newProgress,
        updatedChunks.totalCharacters || 0
      );
    }
    
    // Verificar chunks faltantes si estamos completando
    if (hasValidChunksData && 
        updatedChunks.processed < updatedChunks.total && 
        data.isCompleted === true) {
      const missingChunksWarning = `Se completaron solo ${updatedChunks.processed} de ${updatedChunks.total} fragmentos de texto. El audio puede estar incompleto.`;
      uniqueWarnings.add(missingChunksWarning);
    }
    
    // Create a single update object to batch all changes
    const updateObject: Partial<ConversionState> = {
      status: isComplete ? 'completed' : 'converting',
      progress: finalProgress,
      chunks: updatedChunks,
      time: {
        ...state.time,
        remaining: timeRemaining
      },
      errors: Array.from(uniqueErrors),
      warnings: Array.from(uniqueWarnings)
    };
    
    // Log update summary para verificación
    console.log(`ConversionStore: Updating progress: ${finalProgress}% (source: ${progressSource})`, {
      oldProgress: state.progress,
      oldChunks: `${state.chunks.processed}/${state.chunks.total}`,
      newChunks: `${updateObject.chunks.processed}/${updateObject.chunks.total}`,
      oldChars: `${state.chunks.processedCharacters}/${state.chunks.totalCharacters}`,
      newChars: `${updateObject.chunks.processedCharacters}/${updateObject.chunks.totalCharacters}`,
      isComplete
    });
    
    // Aplicar la actualización con los nuevos datos validados
    set(updateObject);
    
    // Si necesitamos debugging adicional, logs de sistema
    if (isComplete || progressSource === 'characters' || progressSource === 'chunks') {
      LoggingService.debug('conversion', {
        message: 'Actualización significativa del progreso de conversión',
        progress: finalProgress,
        source: progressSource,
        chunks: `${updateObject.chunks.processed}/${updateObject.chunks.total}`,
        chars: `${updateObject.chunks.processedCharacters}/${updateObject.chunks.totalCharacters}`
      });
    }
  },
  
  // Method to update elapsed time safely with an equality check to prevent infinite loops
  updateElapsedTime: (elapsed, startTime) => {
    const state = get();
    // Only update if the time has actually changed AND status is converting/processing to avoid unnecessary renders
    if (state.time.elapsed !== elapsed && 
        (state.status === 'converting' || state.status === 'processing')) {
      console.log(`ConversionStore: Updating elapsed time: ${elapsed}s`);
      set({
        time: {
          ...state.time,
          elapsed,
          startTime
        }
      });
    }
  },
  
  // Establecer error
  setError: (error) => {
    const state = get();
    
    // Avoid duplicate errors
    if (state.errors.includes(error)) {
      return;
    }
    
    console.log(`ConversionStore: Setting error: ${error}`);
    
    set({
      status: 'error',
      errors: [...state.errors, error]
    });
    
    // Log error
    LoggingService.error('conversion', {
      message: 'Error en proceso de conversión',
      error_details: error
    });
  },
  
  // Establecer advertencia
  setWarning: (warning) => {
    const state = get();
    
    // Avoid duplicate warnings
    if (state.warnings.includes(warning)) {
      return;
    }
    
    console.log(`ConversionStore: Adding warning: ${warning}`);
    
    set({
      warnings: [...state.warnings, warning]
    });
  },
  
  // Completar conversión
  completeConversion: (audio, id, duration) => {
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
  },
  
  // Resetear conversión
  resetConversion: () => {
    console.log('ConversionStore: Resetting conversion state');
    set(initialState);
  }
});
