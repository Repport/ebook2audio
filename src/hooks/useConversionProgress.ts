
import { useRef, useState, useEffect } from 'react';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialProgress: number,
  estimatedSeconds: number,
  conversionId?: string | null,
  textLength?: number
) => {
  const [progress, setProgress] = useState<number>(initialProgress);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [processedChunks, setProcessedChunks] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const startTimeRef = useRef<number>(Date.now());
  const lastUpdateRef = useRef<number>(Date.now());
  const processedCharactersRef = useRef<number>(0);
  const initialProgressRef = useRef<number>(initialProgress);
  const progressHistoryRef = useRef<number[]>([]);
  const timeRemainingHistoryRef = useRef<number[]>([]);

  // Actualizar progress cuando el initialProgress cambia
  useEffect(() => {
    console.log(`initialProgress updated: ${initialProgress}%`);
    initialProgressRef.current = initialProgress;
    
    // Evitamos retrocesos en el progreso
    if (initialProgress > progress) {
      setProgress(initialProgress);
    }
  }, [initialProgress, progress]);

  // Reset timers when conversion starts
  useEffect(() => {
    if (status === 'converting' || status === 'processing') {
      console.log('Conversion started, resetting progress tracking');
      startTimeRef.current = Date.now();
      lastUpdateRef.current = Date.now();
      processedCharactersRef.current = 0;
      progressHistoryRef.current = [];
      timeRemainingHistoryRef.current = [];
      
      // Asegurar que siempre empecemos con al menos 1% para que la barra sea visible
      setProgress(Math.max(1, initialProgress));
      
      setElapsedTime(0);
      setProcessedChunks(0);
      setErrors([]);
      setWarnings([]);
    }
  }, [status, initialProgress]);

  // Update elapsed time
  useEffect(() => {
    let intervalId: number;
    
    if (status === 'converting' || status === 'processing') {
      intervalId = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
        
        if (processedCharactersRef.current > 0) {
          const charsPerSecond = processedCharactersRef.current / Math.max(1, elapsed);
          setSpeed(charsPerSecond);
        }

        console.log('Progress update (timer):', {
          elapsed,
          processedChars: processedCharactersRef.current,
          currentProgress: progress,
          speed: processedCharactersRef.current > 0 ? processedCharactersRef.current / Math.max(1, elapsed) : 0
        });
        
        // Si el progreso sigue en 0% después de 5 segundos, establecer al menos 1%
        if (progress <= 0 && elapsed > 5) {
          console.log('Progress still at 0% after 5 seconds, setting to 1%');
          setProgress(1);
        }
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [status, progress]);

  // Función para obtener un progreso suavizado
  const getSmoothedProgress = (newProgress: number): number => {
    // Añadir al historial
    progressHistoryRef.current.push(newProgress);
    
    // Mantener solo los últimos 5 valores
    if (progressHistoryRef.current.length > 5) {
      progressHistoryRef.current.shift();
    }
    
    // Calcular promedio para suavizar fluctuaciones
    const averageProgress = progressHistoryRef.current.reduce((sum, val) => sum + val, 0) / 
                           progressHistoryRef.current.length;
    
    // No permitir que el progreso retroceda y asegurar que sea al menos 1%
    return Math.max(progress, Math.max(1, Math.floor(averageProgress)));
  };

  const updateProgress = (data: ChunkProgressData) => {
    if (!data) {
      console.log('Progress update called with empty data');
      return;
    }

    console.log('Progress update received in hook:', {
      ...data,
      currentProgress: progress,
      elapsed: elapsedTime
    });

    const { processedChunks, totalChunks, processedCharacters, totalCharacters, error, warning, progress: directProgress } = data;
    
    let newProgress: number | undefined;
    
    // Si recibimos un valor directo de progreso, usarlo
    if (typeof directProgress === 'number') {
      console.log(`Setting direct progress value: ${directProgress}%`);
      newProgress = directProgress;
    }
    // De lo contrario calcular basado en caracteres
    else if (typeof processedCharacters === 'number' && typeof totalCharacters === 'number' && totalCharacters > 0) {
      processedCharactersRef.current = processedCharacters;
      newProgress = Math.round((processedCharacters / totalCharacters) * 100);
      console.log(`Calculating progress: ${newProgress}% (${processedCharacters}/${totalCharacters} chars)`);
    }
    
    // Aplicar suavizado al progreso y asegurar que sea al menos 1%
    if (typeof newProgress === 'number') {
      const smoothedProgress = getSmoothedProgress(newProgress);
      console.log(`Smoothed progress: ${smoothedProgress}% (raw: ${newProgress}%)`);
      setProgress(smoothedProgress);
    } else if (status === 'converting' && progress <= 0) {
      // Si estamos convirtiendo pero no tenemos progreso, establecer al menos 1%
      console.log('Setting minimum progress to 1% for visibility');
      setProgress(1);
    }
    
    if (typeof processedChunks === 'number' && typeof totalChunks === 'number') {
      setProcessedChunks(processedChunks);
      setTotalChunks(totalChunks);
    }

    // Manejar errores y advertencias
    if (error && !errors.includes(error)) {
      setErrors(prevErrors => [...prevErrors, error]);
    }

    if (warning && !warnings.includes(warning)) {
      setWarnings(prevWarnings => [...prevWarnings, warning]);
    }
  };

  // Calcular el tiempo restante de manera más estable
  const calculateTimeRemaining = (): number | null => {
    // Si no ha comenzado la conversión o estamos en progreso muy bajo, usar la estimación inicial
    if (elapsedTime < 2 || progress <= 1) {
      // Usamos un tiempo inicial razonable, nunca cero
      const initialEstimate = Math.max(30, Math.min(estimatedSeconds, 300)); // entre 30s y 5 min inicial
      return initialEstimate;
    }
    
    // Si el progreso es muy bajo, limitar el tiempo inicial para evitar valores exagerados
    if (progress < 5) {
      return Math.min(estimatedSeconds, 240); // max 4 minutos si hay poco progreso
    }
    
    // Calcular basado en el progreso actual y el tiempo transcurrido
    const percentageComplete = Math.max(0.01, progress / 100); // Evitar división por cero
    const estimatedTotalTime = elapsedTime / percentageComplete;
    const calculatedRemaining = Math.max(1, estimatedTotalTime - elapsedTime);
    
    // Limitar el tiempo máximo basado en la cantidad de texto
    const maxRemaining = textLength 
      ? Math.min(1800, Math.ceil(textLength / 100)) // max 30 minutos o 1 segundo por cada 100 caracteres
      : 900; // max 15 minutos por defecto
    
    // Aplicar suavizado al tiempo restante
    const smoothedRemaining = smoothTimeRemaining(
      Math.max(1, Math.min(calculatedRemaining, maxRemaining))
    );
    
    return smoothedRemaining;
  };
  
  // Función para suavizar el tiempo restante
  const smoothTimeRemaining = (newTimeRemaining: number): number => {
    // Añadir al historial
    timeRemainingHistoryRef.current.push(newTimeRemaining);
    
    // Mantener solo los últimos 3 valores
    if (timeRemainingHistoryRef.current.length > 3) {
      timeRemainingHistoryRef.current.shift();
    }
    
    // Si tenemos suficientes valores para promediar
    if (timeRemainingHistoryRef.current.length >= 2) {
      // Calcular promedio ponderado (dando más peso a los valores más recientes)
      const weights = [0.2, 0.3, 0.5]; // El último valor tiene más peso
      const validWeights = weights.slice(-timeRemainingHistoryRef.current.length);
      const totalWeight = validWeights.reduce((sum, w) => sum + w, 0);
      
      let weightedSum = 0;
      for (let i = 0; i < timeRemainingHistoryRef.current.length; i++) {
        weightedSum += timeRemainingHistoryRef.current[i] * validWeights[i];
      }
      
      return Math.ceil(weightedSum / totalWeight);
    }
    
    return newTimeRemaining;
  };

  return {
    progress,
    updateProgress,
    elapsedTime,
    timeRemaining: calculateTimeRemaining(),
    hasStarted: processedCharactersRef.current > 0 || progress > 0,
    processedChunks,
    totalChunks,
    speed,
    errors,
    warnings
  };
};
