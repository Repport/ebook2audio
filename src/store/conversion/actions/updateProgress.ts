
import { ConversionState } from '../types';
import { calculateTimeRemaining } from '../utils';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

// Estado de actualización persistente (fuera de la función para mantenerlo entre actualizaciones)
const updateState = {
  lastUpdateHash: '',
  lastUpdateTime: 0,
  lastProgress: 0,
};

export const updateProgressAction = (
  set: (state: Partial<ConversionState>) => void,
  get: () => any,
  LoggingService: any
) => {
  const UPDATE_THROTTLE_MS = 200; // Incrementado para reducir actualizaciones

  const updateProgress = (data: ChunkProgressData) => {
    // Limitar actualizaciones para evitar renders excesivos
    const now = Date.now();
    if (now - updateState.lastUpdateTime < UPDATE_THROTTLE_MS) {
      return;
    }
    
    // Obtener estado actual
    const state = get();
    
    // Si el estado es completado o error, no actualizar el progreso para evitar bucles
    if (state.status === 'completed' || state.status === 'error') {
      return;
    }

    // Validar campos críticos para evitar errores con valores indefinidos
    if (!data || (typeof data.progress !== 'number' && 
                 !data.processedChunks && 
                 !data.processedCharacters && 
                 !data.error && 
                 !data.warning && 
                 !data.isCompleted)) {
      console.warn('ConversionStore: Ignoring invalid progress update:', data);
      return;
    }
    
    // Crear nuevos conjuntos para evitar modificar arrays de estado existentes
    const uniqueErrors = new Set<string>(state.errors);
    const uniqueWarnings = new Set<string>(state.warnings);
    
    // Manejar errores y advertencias
    if (data.error && typeof data.error === 'string' && data.error.trim() !== '') {
      uniqueErrors.add(data.error);
    }
    
    if (data.warning && typeof data.warning === 'string' && data.warning.trim() !== '') {
      uniqueWarnings.add(data.warning);
    }
    
    // Validaciones críticas: verificar que tenemos todos los datos necesarios
    const hasValidChunksData = typeof data.processedChunks === 'number' && 
                              typeof data.totalChunks === 'number' && 
                              data.totalChunks > 0;
                              
    const hasValidCharData = typeof data.processedCharacters === 'number' && 
                            typeof data.totalCharacters === 'number' && 
                            data.totalCharacters > 0;
    
    const hasExplicitProgress = typeof data.progress === 'number' && 
                               !isNaN(data.progress) && 
                               data.progress >= 0;
    
    // Si no hay datos válidos y no es un error o una bandera de finalización, salir temprano
    if (!hasValidChunksData && !hasValidCharData && !hasExplicitProgress && 
        !data.error && !data.isCompleted) {
      return;
    }
    
    // Resolución de datos: priorizar nuevos datos, pero mantener existentes si no hay nuevos datos
    
    // 1. Datos de chunks
    const updatedChunks = {
      processed: hasValidChunksData ? data.processedChunks : state.chunks.processed,
      total: hasValidChunksData ? data.totalChunks : state.chunks.total,
      processedCharacters: hasValidCharData ? data.processedCharacters : state.chunks.processedCharacters,
      totalCharacters: hasValidCharData ? data.totalCharacters : state.chunks.totalCharacters
    };
    
    // 2. Calcular progreso - usar la estrategia más confiable disponible
    let newProgress = state.progress;
    
    // Prioridad 1: Progreso explícito
    if (hasExplicitProgress) {
      newProgress = Math.min(99, data.progress);
    } 
    // Prioridad 2: Cálculo basado en caracteres procesados
    else if (hasValidCharData && updatedChunks.totalCharacters > 0) {
      const calculatedProgress = Math.round((updatedChunks.processedCharacters / updatedChunks.totalCharacters) * 100);
      newProgress = Math.min(99, calculatedProgress);
    }
    // Prioridad 3: Cálculo basado en chunks procesados
    else if (hasValidChunksData && updatedChunks.total > 0) {
      const calculatedProgress = Math.round((updatedChunks.processed / updatedChunks.total) * 100);
      newProgress = Math.min(99, calculatedProgress);
    }
    
    // Asegurar que el progreso siempre avance (nunca retroceda)
    // Excepción: si hay un cambio grande (>10%), aceptarlo (podría ser una corrección)
    if (newProgress < state.progress && Math.abs(newProgress - state.progress) < 10 && !data.isCompleted) {
      newProgress = state.progress;
    }
    
    // Omitir si el progreso no ha cambiado significativamente (evitando renders innecesarios)
    if (Math.abs(newProgress - updateState.lastProgress) < 1 && 
        !data.error && !data.warning && !data.isCompleted && 
        (now - updateState.lastUpdateTime < UPDATE_THROTTLE_MS * 5)) {
      return;
    }
    
    // Verificar si la conversión está completa
    const isComplete = data.isCompleted === true;
    const finalProgress = isComplete ? 100 : newProgress;
    
    // Calcular tiempo restante si no está completo
    let timeRemaining = state.time.remaining;
    
    if (!isComplete && state.time.elapsed > 5 && newProgress > 5) {
      timeRemaining = calculateTimeRemaining(
        state.time.elapsed,
        newProgress,
        updatedChunks.totalCharacters || 0
      );
    }
    
    // Generar un hash del nuevo estado para detectar cambios
    const newStateHash = `${isComplete ? 'completed' : 'converting'}-${finalProgress}-${updatedChunks.processed}/${updatedChunks.total}-${uniqueErrors.size}-${uniqueWarnings.size}`;
    
    // Omitir actualización si nada ha cambiado
    if (newStateHash === updateState.lastUpdateHash) {
      return;
    }
    
    // Actualizar estado de seguimiento
    updateState.lastUpdateHash = newStateHash;
    updateState.lastUpdateTime = now;
    updateState.lastProgress = finalProgress;
    
    // Crear un único objeto de actualización para agrupar todos los cambios
    const updateObject: Partial<ConversionState> = {
      status: isComplete ? 'completed' : (data.error ? 'error' : 'converting'),
      progress: finalProgress,
      chunks: updatedChunks,
      time: {
        ...state.time,
        remaining: timeRemaining
      },
      errors: Array.from(uniqueErrors),
      warnings: Array.from(uniqueWarnings)
    };
    
    // Aplicar la actualización
    set(updateObject);
    
    console.log('Actualización de progreso:', {
      progreso: finalProgress, 
      chunks: `${updatedChunks.processed}/${updatedChunks.total}`,
      caracteres: `${updatedChunks.processedCharacters}/${updatedChunks.totalCharacters}`,
      estado: updateObject.status
    });
  };

  return { updateProgress };
};
