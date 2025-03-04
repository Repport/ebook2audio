
import { ConversionState, ConversionActions } from './types';
import { initialState } from './initialState';
import { calculateTimeRemaining } from './utils';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

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
    
    // Set to converting state
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
    
    // Debug - veamos qué datos estamos recibiendo exactamente
    console.log(`ConversionStore: Progress update raw data:`, JSON.stringify(data));
    
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
    
    // Determinar si tenemos suficiente información para una actualización significativa
    const hasValidData = (
      (typeof data.processedChunks === 'number' && data.processedChunks > 0) ||
      (typeof data.processedCharacters === 'number' && data.processedCharacters > 0) ||
      (typeof data.progress === 'number' && data.progress > 0)
    );
    
    // Si no hay datos válidos pero no es un error, mantenemos el estado actual
    if (!hasValidData && !data.error) {
      console.log('ConversionStore: Received update without valid progress data, maintaining current state');
      return;
    }
    
    // Calcular el progreso - usar la estrategia más fiable disponible
    let newProgress = state.progress;
    let progressSource = 'existing';
    
    // 1. Prioridad: Progreso explícito
    if (typeof data.progress === 'number' && !isNaN(data.progress) && data.progress > 0) {
      newProgress = Math.min(99, data.progress); // Limitar a 99% hasta completado explícitamente
      progressSource = 'explicit';
    } 
    // 2. Prioridad: Cálculo basado en caracteres
    else if (typeof data.processedCharacters === 'number' && data.processedCharacters > 0 && 
             typeof data.totalCharacters === 'number' && data.totalCharacters > 0) {
      const calculatedProgress = Math.round((data.processedCharacters / data.totalCharacters) * 100);
      newProgress = Math.min(99, calculatedProgress);
      progressSource = 'characters';
    }
    // 3. Prioridad: Cálculo basado en chunks
    else if (typeof data.processedChunks === 'number' && data.processedChunks > 0 && 
             typeof data.totalChunks === 'number' && data.totalChunks > 0) {
      const calculatedProgress = Math.round((data.processedChunks / data.totalChunks) * 100);
      newProgress = Math.min(99, calculatedProgress);
      progressSource = 'chunks';
    }
    
    // Asegurar que el progreso siempre avance (nunca retroceda)
    if (newProgress < state.progress && !data.isCompleted) {
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
        data.totalCharacters || 0
      );
    }
    
    // Verificar chunks faltantes
    if (data.processedChunks !== undefined && 
        data.totalChunks !== undefined && 
        data.processedChunks < data.totalChunks && 
        data.isCompleted === true) {
      const missingChunksWarning = `Se completaron solo ${data.processedChunks} de ${data.totalChunks} fragmentos de texto. El audio puede estar incompleto.`;
      uniqueWarnings.add(missingChunksWarning);
    }
    
    // Create a single update object to batch all changes
    const updateObject: Partial<ConversionState> = {
      status: isComplete ? 'completed' : 'converting',
      progress: finalProgress,
      chunks: {
        processed: data.processedChunks !== undefined ? data.processedChunks : state.chunks.processed,
        total: data.totalChunks !== undefined ? data.totalChunks : state.chunks.total,
        processedCharacters: data.processedCharacters !== undefined ? data.processedCharacters : state.chunks.processedCharacters,
        totalCharacters: data.totalCharacters !== undefined ? data.totalCharacters : state.chunks.totalCharacters
      },
      time: {
        ...state.time,
        remaining: timeRemaining
      },
      errors: Array.from(uniqueErrors),
      warnings: Array.from(uniqueWarnings)
    };
    
    // Log update summary
    console.log(`ConversionStore: Updating progress: ${finalProgress}% (source: ${progressSource})`, {
      oldProgress: state.progress,
      chunks: `${updateObject.chunks.processed}/${updateObject.chunks.total}`,
      chars: `${updateObject.chunks.processedCharacters}/${updateObject.chunks.totalCharacters}`,
      isComplete
    });
    
    // Apply updates in a single operation
    set(updateObject);
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
  },
  
  // Resetear conversión
  resetConversion: () => {
    console.log('ConversionStore: Resetting conversion state');
    set(initialState);
  }
});
