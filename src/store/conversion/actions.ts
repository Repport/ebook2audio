
import { ConversionStore, ConversionState } from './types';
import { initialState } from './initialState';
import { calculateTimeRemaining } from './utils';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const createConversionActions = (
  set: (state: Partial<ConversionState>) => void,
  get: () => ConversionStore
): Pick<ConversionStore, keyof Omit<ConversionStore, keyof ConversionState>> => ({
  // Acción para iniciar la conversión
  startConversion: (fileName) => set({
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
  }),
  
  // Actualizar progreso basado en datos del chunk
  updateProgress: (data: ChunkProgressData) => {
    // Obtener estado actual
    const state = get();
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
        data.totalCharacters ||.0
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
    
    // Actualizar estado
    set({
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
    });
  },
  
  // Actualizar tiempo
  updateTime: () => {
    const state = get();
    if (state.status !== 'converting' && state.status !== 'processing') return;
    
    // Solo actualizar si tenemos un tiempo de inicio
    if (state.time.startTime) {
      const elapsed = Math.floor((Date.now() - state.time.startTime) / 1000);
      
      set({
        time: {
          ...state.time,
          elapsed
        }
      });
      
      // Auto-incrementar el progreso ligeramente para mantener sensación de actividad
      if (elapsed % 3 === 0 && state.progress < 95) {
        set({
          progress: state.progress + 0.1
        });
      }
    }
  },
  
  // Method to update elapsed time safely
  updateElapsedTime: (elapsed, startTime) => set({
    time: {
      ...get().time,
      elapsed,
      startTime
    }
  }),
  
  // Establecer error
  setError: (error) => set({
    errors: [...get().errors, error]
  }),
  
  // Establecer advertencia
  setWarning: (warning) => set({
    warnings: [...get().warnings, warning]
  }),
  
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
