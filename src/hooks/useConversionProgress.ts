
import { useRef, useState, useEffect } from 'react';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialProgress: number,
  estimatedSeconds: number,
  conversionId?: string | null,
  textLength?: number
) => {
  // Siempre iniciamos con al menos 1% de progreso para visibilidad
  const [progress, setProgress] = useState<number>(Math.max(1, initialProgress));
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [processedChunks, setProcessedChunks] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  // Referencias para mantener estado entre renders
  const startTimeRef = useRef<number>(Date.now());
  const lastProgressUpdateRef = useRef<number>(Date.now());
  const processedCharactersRef = useRef<number>(0);
  const totalCharactersRef = useRef<number>(0);
  const progressLogRef = useRef<{time: number, value: number}[]>([]);
  const forceUpdateTimeoutRef = useRef<number | null>(null);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (forceUpdateTimeoutRef.current) {
        window.clearTimeout(forceUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Cuando cambia el estado de conversión
  useEffect(() => {
    console.log(`Conversion status changed to: ${status}`);
    
    if (status === 'converting' || status === 'processing') {
      // Reiniciar estado al iniciar conversión
      startTimeRef.current = Date.now();
      lastProgressUpdateRef.current = Date.now();
      processedCharactersRef.current = 0;
      totalCharactersRef.current = 0;
      progressLogRef.current = [];
      
      // Establecer progreso inicial
      console.log('Setting initial progress on conversion start');
      setProgress(Math.max(1, initialProgress));
      setElapsedTime(0);
      setProcessedChunks(0);
      setTotalChunks(0);
      setErrors([]);
      setWarnings([]);
      
      // Programar actualización forzada si no hay progreso
      scheduleForceUpdate();
    } else if (status === 'completed') {
      // Asegurar que el progreso esté al 100% al completarse
      setProgress(100);
      
      // Limpiar timeout si existe
      if (forceUpdateTimeoutRef.current) {
        window.clearTimeout(forceUpdateTimeoutRef.current);
        forceUpdateTimeoutRef.current = null;
      }
    }
  }, [status, initialProgress]);

  // Actualizar progreso inicial cuando cambia
  useEffect(() => {
    console.log(`initialProgress updated: ${initialProgress}%`);
    
    // Solo actualizar si el progreso inicial es mayor que el actual
    if (initialProgress > progress) {
      console.log(`Updating progress from initialProgress: ${initialProgress}%`);
      setProgress(Math.max(1, initialProgress));
    }
  }, [initialProgress, progress]);

  // Función para programar una actualización forzada si el progreso se estanca
  const scheduleForceUpdate = () => {
    if (forceUpdateTimeoutRef.current) {
      window.clearTimeout(forceUpdateTimeoutRef.current);
    }
    
    forceUpdateTimeoutRef.current = window.setTimeout(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastProgressUpdateRef.current;
      
      // Si han pasado más de 10 segundos sin actualizaciones y estamos convirtiendo
      if (timeSinceLastUpdate > 10000 && (status === 'converting' || status === 'processing')) {
        console.log('Force progress update due to stagnation');
        
        // Incrementar ligeramente el progreso para mostrar actividad
        if (progress < 90) {
          const newProgress = Math.min(90, progress + 5);
          console.log(`Forcing progress from ${progress}% to ${newProgress}%`);
          setProgress(newProgress);
          
          // Registrar esta actualización
          progressLogRef.current.push({time: now, value: newProgress});
          lastProgressUpdateRef.current = now;
        }
        
        // Programar siguiente actualización
        scheduleForceUpdate();
      }
    }, 10000); // Verificar cada 10 segundos
  };

  // Timer para actualizar tiempo transcurrido
  useEffect(() => {
    let intervalId: number;
    
    if (status === 'converting' || status === 'processing') {
      intervalId = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
        
        // Actualizar velocidad si tenemos datos
        if (processedCharactersRef.current > 0) {
          const charsPerSecond = processedCharactersRef.current / Math.max(1, elapsed);
          setSpeed(charsPerSecond);
        }
        
        // Log para debug
        console.log('Progress timer update:', {
          elapsed,
          processedChars: processedCharactersRef.current,
          totalChars: totalCharactersRef.current,
          currentProgress: progress,
          timeSinceLastUpdate: (now - lastProgressUpdateRef.current) / 1000
        });
        
        // Si han pasado más de 15 segundos desde la última actualización y estamos por debajo del 90%,
        // incrementar ligeramente el progreso para mostrar actividad
        const timeSinceLastUpdate = now - lastProgressUpdateRef.current;
        if (timeSinceLastUpdate > 15000 && progress < 90) {
          const newProgress = Math.min(90, progress + 1);
          console.log(`Auto-incrementing progress from ${progress}% to ${newProgress}% due to inactivity`);
          setProgress(newProgress);
        }
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [status, progress]);

  // Procesar actualizaciones de progreso
  const updateProgress = (data: ChunkProgressData) => {
    if (!data) {
      console.log('Progress update called with empty data');
      return;
    }
    
    // Registrar tiempo de actualización
    lastProgressUpdateRef.current = Date.now();
    
    console.log('Progress update received:', data);
    
    const { 
      processedChunks, 
      totalChunks, 
      processedCharacters, 
      totalCharacters, 
      error, 
      warning, 
      progress: directProgress,
      isCompleted 
    } = data;
    
    // Si es un mensaje de completado, establecer progreso a 100%
    if (isCompleted) {
      console.log('Received completion signal, setting progress to 100%');
      setProgress(100);
      return;
    }
    
    // Actualizar contadores de caracteres
    if (typeof processedCharacters === 'number') {
      processedCharactersRef.current = processedCharacters;
    }
    
    if (typeof totalCharacters === 'number' && totalCharacters > 0) {
      totalCharactersRef.current = totalCharacters;
    }
    
    // Calcular nuevo valor de progreso
    let newProgress: number | undefined;
    
    // Usar progreso directo si está disponible
    if (typeof directProgress === 'number' && !isNaN(directProgress)) {
      newProgress = directProgress;
      console.log(`Using direct progress: ${newProgress}%`);
    }
    // Calcular basado en caracteres procesados/totales
    else if (processedCharactersRef.current > 0 && totalCharactersRef.current > 0) {
      newProgress = Math.round((processedCharactersRef.current / totalCharactersRef.current) * 100);
      console.log(`Calculated progress from chars: ${newProgress}% (${processedCharactersRef.current}/${totalCharactersRef.current})`);
    }
    // Usar porcentaje de chunks procesados si disponible
    else if (typeof processedChunks === 'number' && typeof totalChunks === 'number' && totalChunks > 0) {
      newProgress = Math.round((processedChunks / totalChunks) * 100);
      console.log(`Calculated progress from chunks: ${newProgress}% (${processedChunks}/${totalChunks})`);
    }
    
    // Actualizar progreso si tenemos un valor válido y es mayor que el actual
    if (typeof newProgress === 'number' && !isNaN(newProgress)) {
      // Limitar entre 1% y 100%
      newProgress = Math.max(1, Math.min(100, newProgress));
      
      // Solo actualizar si el nuevo progreso es mayor
      if (newProgress > progress) {
        console.log(`Updating progress from ${progress}% to ${newProgress}%`);
        setProgress(newProgress);
        
        // Registrar para análisis
        progressLogRef.current.push({time: Date.now(), value: newProgress});
      } else {
        console.log(`Ignoring lower progress update: current=${progress}%, new=${newProgress}%`);
      }
    }
    
    // Actualizar contadores de chunks
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
    
    // Reprogramar la actualización forzada
    scheduleForceUpdate();
  };

  // Calcular tiempo restante
  const calculateTimeRemaining = (): number | null => {
    // Si estamos en el inicio o el progreso es muy bajo, dar estimación conservadora
    if (elapsedTime < 3 || progress <= 1) {
      return Math.max(30, Math.min(estimatedSeconds, 300));
    }
    
    // Calcular basado en progreso actual
    const percentageComplete = Math.max(0.01, progress / 100);
    const estimatedTotalTime = elapsedTime / percentageComplete;
    const remaining = Math.max(1, estimatedTotalTime - elapsedTime);
    
    // Limitar a un máximo razonable basado en tamaño del texto
    const maxRemaining = textLength 
      ? Math.min(1800, Math.max(30, Math.ceil(textLength / 100)))
      : 600;
    
    return Math.min(remaining, maxRemaining);
  };

  return {
    progress,
    updateProgress,
    elapsedTime,
    timeRemaining: calculateTimeRemaining(),
    hasStarted: processedCharactersRef.current > 0 || elapsedTime > 3,
    processedChunks,
    totalChunks,
    speed,
    errors,
    warnings
  };
};
