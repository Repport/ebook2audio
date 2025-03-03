
import { useState, useRef, useEffect } from 'react';

export const useTimeCalculation = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialElapsedTime: number = 0,
  estimatedSeconds: number = 0,
  textLength: number = 0
) => {
  // Estado para tiempo transcurrido y restante
  const [elapsedTime, setElapsedTime] = useState<number>(initialElapsedTime || 0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  // Referencias para datos persistentes
  const startTimeRef = useRef<number>(Date.now() - (initialElapsedTime * 1000));
  const elapsedTimeRef = useRef<number>(initialElapsedTime || 0);
  const lastProgressRef = useRef<number>(1);
  
  // Datos para cálculo de tiempo
  const totalEstimatedSeconds = useRef<number>(estimatedSeconds || 
    Math.max(30, Math.ceil(textLength / 15))); // ~15 caracteres por segundo
  
  // Inicializar tiempo de inicio al montar el componente
  useEffect(() => {
    console.log(`[useTimeCalculation] Initializing with elapsed time: ${initialElapsedTime}s, estimated: ${estimatedSeconds}s`);
    
    // Si hay tiempo transcurrido, calcular el tiempo de inicio
    if (initialElapsedTime > 0) {
      // Tiempo de inicio = tiempo actual - tiempo transcurrido
      startTimeRef.current = Date.now() - (initialElapsedTime * 1000);
      elapsedTimeRef.current = initialElapsedTime;
      
      // Log para depuración
      console.log(`[useTimeCalculation] Restored start time from ${initialElapsedTime}s ago`);
    } else {
      // Tiempo de inicio = tiempo actual
      startTimeRef.current = Date.now();
      elapsedTimeRef.current = 0;
    }
    
    // Estimar tiempo restante inicial
    updateTimeRemaining(1);
  }, [initialElapsedTime, estimatedSeconds]);
  
  // Reset completo del cálculo de tiempo
  const resetTimeCalculation = () => {
    console.log('[useTimeCalculation] Full reset of time calculation');
    startTimeRef.current = Date.now();
    elapsedTimeRef.current = 0;
    lastProgressRef.current = 1;
    setElapsedTime(0);
    setTimeRemaining(null);
  };
  
  // Actualizar tiempo restante basado en progreso y tiempo transcurrido
  const updateTimeRemaining = (progress: number) => {
    // Validar progreso
    if (!progress || isNaN(progress) || progress <= 0 || progress > 100) {
      return;
    }
    
    // Almacenar para análisis
    lastProgressRef.current = progress;
    
    // Si el progreso es 100%, no hay tiempo restante
    if (progress >= 100) {
      setTimeRemaining(0);
      return;
    }
    
    const elapsed = elapsedTimeRef.current;
    
    // Necesitamos al menos 5 segundos de tiempo transcurrido para un cálculo preciso
    if (elapsed < 5) {
      // En los primeros segundos, usar el estimado
      if (totalEstimatedSeconds.current > 0) {
        setTimeRemaining(totalEstimatedSeconds.current - elapsed);
      }
      return;
    }
    
    // Calcular tiempo restante basado en el progreso actual y tiempo transcurrido
    // Fórmula: (tiempo_transcurrido / progreso_actual) * (100 - progreso_actual)
    const normalizedProgress = Math.max(0.01, progress / 100);
    const remainingProgress = 1 - normalizedProgress;
    
    // Tiempo transcurrido por unidad de progreso × progreso restante
    const estimatedTimeRemaining = Math.round((elapsed / normalizedProgress) * remainingProgress);
    
    // Limitar a un rango razonable y aplicar un factor de corrección basado en el texto
    const minRemaining = Math.max(1, Math.min(10, textLength / 1000));
    const maxRemaining = Math.max(30, Math.min(3600, textLength / 5));
    
    // Aplicar límites y suavizar con previous
    const boundedRemaining = Math.max(minRemaining, Math.min(maxRemaining, estimatedTimeRemaining));
    
    // Suavizar los cambios para evitar fluctuaciones
    const previousRemaining = timeRemaining || boundedRemaining;
    const smoothedRemaining = (previousRemaining * 0.7) + (boundedRemaining * 0.3);
    
    // Log cada 10 segundos para no saturar la consola
    if (elapsed % 10 === 0) {
      console.log(`[useTimeCalculation] Progress: ${progress.toFixed(1)}%, Elapsed: ${elapsed}s, Raw remaining: ${estimatedTimeRemaining}s, Smoothed: ${Math.round(smoothedRemaining)}s`);
    }
    
    // Establecer el tiempo restante
    setTimeRemaining(Math.round(smoothedRemaining));
  };
  
  return {
    elapsedTime,
    setElapsedTime,
    timeRemaining,
    startTimeRef,
    elapsedTimeRef,
    resetTimeCalculation,
    updateTimeRemaining
  };
};
