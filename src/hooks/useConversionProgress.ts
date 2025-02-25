
import { useRef, useState, useEffect } from 'react';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialProgress: number,
  estimatedSeconds: number,
  conversionId?: string | null,
  textLength?: number
) => {
  // Estado principal
  const [progress, setProgress] = useState<number>(Math.max(1, initialProgress));
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [processedChunks, setProcessedChunks] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  // Referencias para datos persistentes entre renders
  const startTimeRef = useRef<number>(Date.now());
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const progressHistoryRef = useRef<{time: number, value: number}[]>([]);
  const processedCharsRef = useRef<number>(0);
  const totalCharsRef = useRef<number>(0);
  const autoIncrementRef = useRef<boolean>(false);
  
  // Cuando cambia el estado de conversión
  useEffect(() => {
    if (status === 'converting' || status === 'processing') {
      // Reiniciar estado al iniciar conversión
      startTimeRef.current = Date.now();
      lastUpdateTimeRef.current = Date.now();
      progressHistoryRef.current = [];
      processedCharsRef.current = 0;
      totalCharsRef.current = 0;
      autoIncrementRef.current = false;
      
      setProgress(Math.max(1, initialProgress));
      setElapsedTime(0);
      setProcessedChunks(0);
      setTotalChunks(0);
      setErrors([]);
      setWarnings([]);
    } 
    else if (status === 'completed') {
      // Asegurar que el progreso esté al 100% al completarse
      setProgress(100);
    }
  }, [status, initialProgress]);
  
  // Actualizar progreso inicial cuando cambia
  useEffect(() => {
    if (initialProgress > progress) {
      setProgress(Math.max(1, initialProgress));
    }
  }, [initialProgress, progress]);

  // Timer para actualizar tiempo transcurrido y progreso automático
  useEffect(() => {
    let intervalId: number;
    
    if (status === 'converting' || status === 'processing') {
      intervalId = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
        
        // Actualizar velocidad si tenemos datos de caracteres
        if (processedCharsRef.current > 0) {
          const charsPerSecond = processedCharsRef.current / Math.max(1, elapsed);
          setSpeed(charsPerSecond);
        }
        
        // Auto-incremento inteligente del progreso si no hay actualizaciones
        const secondsSinceLastUpdate = (now - lastUpdateTimeRef.current) / 1000;
        
        // Si han pasado más de 10 segundos sin actualizaciones y estamos por debajo del 95%
        if (secondsSinceLastUpdate > 10 && progress < 95) {
          // Incremento basado en el tiempo transcurrido y progreso actual
          // Más lento cuanto más alto sea el progreso actual
          const increment = Math.max(0.5, (100 - progress) / 100);
          const newProgress = Math.min(95, progress + increment);
          
          // Registrar que estamos en modo auto-incremento
          if (!autoIncrementRef.current) {
            console.log('Activando auto-incremento de progreso por inactividad');
            autoIncrementRef.current = true;
          }
          
          console.log(`Auto-incrementando progreso: ${progress}% → ${newProgress}%`);
          setProgress(newProgress);
          
          // No actualizar lastUpdateTimeRef ya que esto no es una actualización real
          // Solo registrar para análisis
          progressHistoryRef.current.push({time: now, value: newProgress});
        }
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [status, progress]);

  // Función para procesar actualizaciones de progreso
  const updateProgress = (data: ChunkProgressData) => {
    if (!data) return;
    
    // Marcar el tiempo de esta actualización
    const now = Date.now();
    lastUpdateTimeRef.current = now;
    
    // Si recibimos señal de completado, ir al 100%
    if (data.isCompleted) {
      setProgress(100);
      return;
    }
    
    // Actualizar contadores de chunks si están disponibles
    if (typeof data.processedChunks === 'number' && typeof data.totalChunks === 'number') {
      setProcessedChunks(data.processedChunks);
      setTotalChunks(data.totalChunks);
    }
    
    // Actualizar contadores de caracteres si están disponibles
    if (typeof data.processedCharacters === 'number') {
      processedCharsRef.current = data.processedCharacters;
    }
    
    if (typeof data.totalCharacters === 'number' && data.totalCharacters > 0) {
      totalCharsRef.current = data.totalCharacters;
    }
    
    // Determinar el nuevo valor de progreso
    let newProgress: number | undefined;
    
    // 1. Usar progreso directo si está disponible
    if (typeof data.progress === 'number' && !isNaN(data.progress)) {
      newProgress = data.progress;
    }
    // 2. Calcular basado en caracteres si están disponibles
    else if (processedCharsRef.current > 0 && totalCharsRef.current > 0) {
      newProgress = Math.round((processedCharsRef.current / totalCharsRef.current) * 100);
    }
    // 3. Calcular basado en chunks si están disponibles
    else if (data.processedChunks && data.totalChunks) {
      newProgress = Math.round((data.processedChunks / data.totalChunks) * 100);
    }
    
    // Si tenemos un valor válido, actualizar el progreso
    if (typeof newProgress === 'number' && !isNaN(newProgress)) {
      // Limitar entre 1% y 100%
      newProgress = Math.max(1, Math.min(100, newProgress));
      
      // Si estábamos en auto-incremento, necesitamos un salto significativo
      // para aceptar un valor externo y salir del modo auto
      const significantChange = autoIncrementRef.current 
        ? newProgress > progress + 5  // Requiere un salto de al menos 5%
        : newProgress > progress;     // Cualquier incremento es válido
      
      if (significantChange) {
        // Salir del modo auto-incremento si estábamos en él
        if (autoIncrementRef.current) {
          console.log(`Saliendo del modo auto-incremento con progreso real: ${newProgress}%`);
          autoIncrementRef.current = false;
        }
        
        // Actualizar progreso y registrar
        setProgress(newProgress);
        progressHistoryRef.current.push({time: now, value: newProgress});
      }
    }
    
    // Manejar errores y advertencias
    if (data.error && !errors.includes(data.error)) {
      setErrors(prev => [...prev, data.error!]);
    }
    
    if (data.warning && !warnings.includes(data.warning)) {
      setWarnings(prev => [...prev, data.warning!]);
    }
  };

  // Calcular tiempo restante de manera estable
  const calculateTimeRemaining = (): number | null => {
    // Etapa inicial de la conversión
    if (elapsedTime < 3 || progress <= 1) {
      return estimatedSeconds || 120; // Valor inicial razonable
    }
    
    // Cálculo estándar basado en progreso y tiempo transcurrido
    const percentComplete = Math.max(0.01, progress / 100);
    const estimatedTotalTime = elapsedTime / percentComplete;
    const remaining = Math.max(1, estimatedTotalTime - elapsedTime);
    
    // Valor máximo razonable según tamaño del texto
    const maxValue = textLength 
      ? Math.min(1800, Math.max(30, textLength / 100)) 
      : 600;
    
    return Math.min(remaining, maxValue);
  };

  return {
    progress,
    updateProgress,
    elapsedTime,
    timeRemaining: calculateTimeRemaining(),
    hasStarted: elapsedTime > 2 || progress > 1,
    processedChunks,
    totalChunks,
    speed,
    errors,
    warnings
  };
};
