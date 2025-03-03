
import { useEffect } from 'react';
import { ChunkProgressData } from '@/services/conversion/types/chunks';
import { useTimeCalculation } from './conversion-progress/useTimeCalculation';
import { useProgressManagement } from './conversion-progress/useProgressManagement';
import { useErrorWarningManagement } from './conversion-progress/useErrorWarningManagement';

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialProgress: number,
  estimatedSeconds: number,
  conversionId?: string | null,
  textLength?: number,
  initialElapsedTime?: number
) => {
  // Usar nuestros hooks especializados
  const timeCalculation = useTimeCalculation(
    status, 
    initialElapsedTime, 
    estimatedSeconds, 
    textLength
  );
  
  const progressManagement = useProgressManagement(initialProgress);
  
  const errorWarningManagement = useErrorWarningManagement();
  
  // Resetear estados cuando el status cambia a 'converting'
  useEffect(() => {
    console.log(`ConversionProgress: Status changed to ${status}, progress: ${initialProgress}`);
    
    if (status === 'converting' || status === 'processing') {
      // Solo resetear estos valores si venimos de 'completed' o 'error'
      if (['completed', 'error', 'idle'].includes(status as string)) {
        console.log(`ConversionProgress: Resetting from ${status} state`);
        progressManagement.setProgress(Math.max(1, initialProgress));
        errorWarningManagement.resetErrorsAndWarnings();
        timeCalculation.resetTimeCalculation();
      }
    } 
    else if (status === 'completed') {
      // Asegurar que el progreso está al 100% cuando se completa
      progressManagement.setProgress(100);
    }
  }, [status, initialProgress]);

  // Actualizar el progreso inicial cuando cambia
  useEffect(() => {
    if (initialProgress > 0 && initialProgress > progressManagement.progress) {
      console.log(`ConversionProgress: Updating from external progress: ${initialProgress}%`);
      progressManagement.setProgress(Math.max(1, initialProgress));
    }
  }, [initialProgress, progressManagement.progress]);

  // Timer para actualizar tiempo transcurrido y progreso automático
  useEffect(() => {
    let intervalId: number;
    
    if (status === 'converting' || status === 'processing') {
      console.log('ConversionProgress: Starting progress update interval');
      
      intervalId = window.setInterval(() => {
        const now = Date.now();
        
        // Calcular tiempo transcurrido desde el inicio (preservando anterior)
        const elapsed = Math.floor((now - timeCalculation.startTimeRef.current) / 1000);
        
        // Actualizar ambas referencias
        timeCalculation.setElapsedTime(elapsed);
        timeCalculation.elapsedTimeRef.current = elapsed;
        
        // Manejar auto-incremento para progreso
        const newProgress = progressManagement.handleAutoIncrement();
        
        // Actualizar tiempo restante
        timeCalculation.updateTimeRemaining(newProgress);
        
        // Log para depuración
        if (elapsed % 5 === 0) { // Solo cada 5 segundos para no saturar
          console.log(`ConversionProgress: Elapsed=${elapsed}s, Progress=${newProgress}%, Remaining=${timeCalculation.timeRemaining}s`);
        }
        
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [status, progressManagement.progress, estimatedSeconds, textLength, timeCalculation.elapsedTime]);

  // Función principal para procesar actualizaciones
  const updateProgress = (data: ChunkProgressData) => {
    // Actualizar valores de progreso
    progressManagement.updateProgress(data, timeCalculation.elapsedTime);
    
    // Actualizar errores y advertencias
    errorWarningManagement.updateErrorsAndWarnings(data);
    
    // Actualizar tiempo restante si hay un cambio significativo de progreso
    if (data.progress && Math.abs(data.progress - progressManagement.progress) > 2) {
      timeCalculation.updateTimeRemaining(data.progress);
    }
  };

  // Función para resetear todo el estado de progreso
  const resetProgress = () => {
    console.log('ConversionProgress: Performing full reset');
    progressManagement.resetProgress();
    errorWarningManagement.resetErrorsAndWarnings();
    timeCalculation.resetTimeCalculation();
  };

  return {
    progress: progressManagement.progress,
    updateProgress,
    resetProgress,
    elapsedTime: timeCalculation.elapsedTime,
    timeRemaining: timeCalculation.timeRemaining,
    hasStarted: timeCalculation.elapsedTime > 1 || progressManagement.progress > 1,
    processedChunks: progressManagement.processedChunks,
    totalChunks: progressManagement.totalChunks,
    speed: progressManagement.speed,
    errors: errorWarningManagement.errors,
    warnings: errorWarningManagement.warnings
  };
};
