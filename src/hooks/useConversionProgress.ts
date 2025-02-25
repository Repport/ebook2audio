
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
      
      // Siempre iniciamos desde 0 al comenzar una nueva conversión
      setProgress(0);
      
      setElapsedTime(0);
      setProcessedChunks(0);
      setErrors([]);
      setWarnings([]);
    }
  }, [status]);

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
    
    // No permitir que el progreso retroceda
    return Math.max(progress, Math.floor(averageProgress));
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
    
    // Aplicar suavizado al progreso
    if (typeof newProgress === 'number') {
      const smoothedProgress = getSmoothedProgress(newProgress);
      console.log(`Smoothed progress: ${smoothedProgress}% (raw: ${newProgress}%)`);
      setProgress(smoothedProgress);
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

  // Calcular el tiempo restante de manera más precisa
  const calculateTimeRemaining = (): number | null => {
    if (elapsedTime <= 0 || progress <= 0) {
      return estimatedSeconds;
    }
    
    // Si el progreso es muy bajo, mejor usar la estimación inicial
    if (progress < 5) {
      return estimatedSeconds;
    }
    
    // Calcular basado en el progreso actual
    const percentageComplete = progress / 100;
    const estimatedTotalTime = elapsedTime / percentageComplete;
    const calculatedRemaining = estimatedTotalTime - elapsedTime;
    
    // No permitir que el tiempo restante aumente
    return Math.max(1, Math.min(calculatedRemaining, estimatedSeconds));
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
