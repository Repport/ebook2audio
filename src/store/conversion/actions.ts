
import { ConversionStore, ConversionState, ConversionActions } from './types';
import { initialState } from './initialState';
import { calculateTimeRemaining } from './utils';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const createConversionActions = (
  set: (state: Partial<ConversionState>) => void,
  get: () => ConversionStore
): ConversionActions => ({
  // Acción para iniciar la conversión
  startConversion: (fileName) => {
    // Before starting a new conversion, check if we need to reset
    const currentState = get();
    const needsReset = currentState.status !== 'idle' && currentState.status !== 'converting';
    
    if (needsReset) {
      // Reset first to avoid state conflicts
      set(initialState);
    }
    
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
      return;
    }
    
    // Create new sets to avoid modifying existing state arrays
    const uniqueErrors = new Set(state.errors);
    const uniqueWarnings = new Set(state.warnings);
    
    // Manejar errores y advertencias
    if (data.error && typeof data.error === 'string' && data.error.trim() !== '') {
      uniqueErrors.add(data.error);
    }
    
    if (data.warning && typeof data.warning === 'string' && data.warning.trim() !== '') {
      uniqueWarnings.add(data.warning);
    }
    
    // Calcular el progreso
    let newProgress = state.progress;
    
    // Si tenemos un progreso explícito, usarlo
    if (typeof data.progress === 'number' && data.progress > newProgress) {
      newProgress = data.progress;
    } 
    // Si no, calcular basado en caracteres
    else if (data.processedCharacters && data.totalCharacters) {
      const calculatedProgress = Math.round((data.processedCharacters / data.totalCharacters) * 100);
      if (calculatedProgress > newProgress) {
        newProgress = calculatedProgress;
      }
    }
    // Si no hay información de caracteres, usar chunks
    else if (data.processedChunks && data.totalChunks) {
      const calculatedProgress = Math.round((data.processedChunks / data.totalChunks) * 100);
      if (calculatedProgress > newProgress) {
        newProgress = calculatedProgress;
      }
    }
    
    // Verificar si la conversión está completa
    const isComplete = data.isCompleted === true || newProgress >= 100;
    
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
      progress: Math.min(99, newProgress), // Mantener en 99% hasta que explícitamente completemos
      chunks: {
        processed: data.processedChunks || state.chunks.processed,
        total: data.totalChunks || state.chunks.total,
        processedCharacters: data.processedCharacters || state.chunks.processedCharacters,
        totalCharacters: data.totalCharacters || state.chunks.totalCharacters
      },
      time: {
        ...state.time,
        remaining: timeRemaining
      },
      errors: Array.from(uniqueErrors),
      warnings: Array.from(uniqueWarnings)
    };
    
    // Apply updates in a single operation
    set(updateObject);
  },
  
  // Method to update elapsed time safely
  updateElapsedTime: (elapsed, startTime) => {
    const state = get();
    // Only update if the time has actually changed to avoid unnecessary renders
    if (state.time.elapsed !== elapsed) {
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
    
    set({
      warnings: [...state.warnings, warning]
    });
  },
  
  // Completar conversión
  completeConversion: (audio, id, duration) => set({
    status: 'completed',
    progress: 100,
    audioData: audio,
    conversionId: id,
    audioDuration: duration
  }),
  
  // Resetear conversión
  resetConversion: () => set(initialState)
});
