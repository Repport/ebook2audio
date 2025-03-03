
import { useState, useRef, useEffect } from 'react';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const useProgressManagement = (initialProgress: number = 0) => {
  const [progress, setProgress] = useState<number>(Math.max(1, initialProgress));
  const [processedChunks, setProcessedChunks] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  
  // Referencias para datos persistentes
  const progressHistoryRef = useRef<{time: number, value: number}[]>([]);
  const processedCharsRef = useRef<number>(0);
  const totalCharsRef = useRef<number>(0);
  const autoIncrementRef = useRef<boolean>(false);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const errorCountRef = useRef<number>(0);
  const lastValidProgressRef = useRef<number>(Math.max(1, initialProgress));
  const inactivityTimerRef = useRef<number | null>(null);
  const heartbeatCountRef = useRef<number>(0);

  // Asegurar un progreso mínimo visible al inicializar
  useEffect(() => {
    console.log('Inicializando progress management con progreso inicial:', initialProgress);
    if (progress < 1) {
      console.log('Garantizando progreso mínimo del 1%');
      setProgress(1);
    }
    
    // Iniciar un "heartbeat" que garantiza que siempre tengamos alguna actividad visible
    startInactivityTimer();
    
    return () => {
      // Limpiar timers al desmontar
      if (inactivityTimerRef.current !== null) {
        window.clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  // Establece un timer que incrementará ligeramente el progreso si no hay actividad
  // Este "heartbeat" es crucial para dar feedback al usuario
  const startInactivityTimer = () => {
    if (inactivityTimerRef.current !== null) {
      window.clearTimeout(inactivityTimerRef.current);
    }
    
    inactivityTimerRef.current = window.setTimeout(() => {
      const now = Date.now();
      const secondsSinceLastUpdate = (now - lastUpdateTimeRef.current) / 1000;
      
      if (secondsSinceLastUpdate > 2 && progress < 98) {
        heartbeatCountRef.current += 1;
        console.log(`Heartbeat #${heartbeatCountRef.current}: Sin actividad por ${secondsSinceLastUpdate.toFixed(1)}s`);
        
        // Incremento pequeño para mantener percepción de actividad
        const smallIncrement = Math.min(0.5, Math.max(0.1, progress / 200));
        incrementProgress(smallIncrement);
        
        // Si llevamos muchos heartbeats, aumentar la cantidad para evitar estancamiento percibido
        if (heartbeatCountRef.current > 10 && progress < 90) {
          incrementProgress(0.5);
        }
      }
      
      // Continuar el heartbeat
      startInactivityTimer();
    }, 2000);
  };

  // Incrementar progreso de forma segura
  const incrementProgress = (amount: number) => {
    setProgress(prev => {
      const newProgress = Math.min(99, prev + amount);
      console.log(`Incrementando progreso automáticamente: ${prev.toFixed(1)}% → ${newProgress.toFixed(1)}%`);
      return newProgress;
    });
  };

  // Procesar actualizaciones de progreso
  const updateProgress = (
    data: ChunkProgressData,
    elapsedTime: number
  ) => {
    if (!data) return;
    
    // Marcar tiempo de esta actualización y resetear el contador de heartbeat
    const now = Date.now();
    lastUpdateTimeRef.current = now;
    heartbeatCountRef.current = 0;
    
    // Reiniciar el timer de inactividad
    startInactivityTimer();
    
    // Log para depuración
    console.log('Actualización de progreso recibida:', {
      progress: data.progress,
      processedChunks: data.processedChunks,
      totalChunks: data.totalChunks,
      processedChars: data.processedCharacters,
      totalChars: data.totalCharacters,
      isCompleted: data.isCompleted,
      hasError: !!data.error
    });
    
    // Si recibimos señal de completado, ir a 100%
    if (data.isCompleted) {
      setProgress(100);
      return;
    }

    // Manejar errores sin interrumpir el progreso
    if (data.error) {
      errorCountRef.current += 1;
      console.warn(`Error en chunk (${errorCountRef.current} errores totales): ${data.error}`);
      // No retornamos para seguir procesando datos parciales
    }
    
    // Actualizar contadores de chunks si están disponibles
    if (typeof data.processedChunks === 'number' && typeof data.totalChunks === 'number') {
      setProcessedChunks(data.processedChunks);
      setTotalChunks(data.totalChunks);
      
      // Si tenemos chunks pero no caracteres, calculamos progreso basado en chunks
      if (!data.processedCharacters && !data.progress) {
        const chunkProgress = Math.round((data.processedChunks / Math.max(1, data.totalChunks)) * 100);
        
        // Solo si es mayor que el progreso actual o el último válido
        if (chunkProgress > progress || chunkProgress > lastValidProgressRef.current) {
          console.log(`Actualizando progreso basado en chunks: ${chunkProgress}%`);
          setProgress(Math.max(1, chunkProgress));
          lastValidProgressRef.current = Math.max(lastValidProgressRef.current, chunkProgress);
        }
      }
    }
    
    // Actualizar contadores de caracteres si están disponibles
    if (typeof data.processedCharacters === 'number') {
      processedCharsRef.current = data.processedCharacters;
    }
    
    if (typeof data.totalCharacters === 'number' && data.totalCharacters > 0) {
      totalCharsRef.current = data.totalCharacters;
    }
    
    // Actualizar velocidad si tenemos datos de caracteres
    if (processedCharsRef.current > 0 && elapsedTime > 0) {
      const charsPerSecond = processedCharsRef.current / Math.max(1, elapsedTime);
      setSpeed(charsPerSecond);
    }
    
    // Determinar nuevo valor de progreso
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
      newProgress = Math.round((data.processedChunks / Math.max(1, data.totalChunks)) * 100);
    }
    
    // Si tenemos un valor válido, actualizar progreso
    if (typeof newProgress === 'number' && !isNaN(newProgress)) {
      // Limitar entre 1% y 100%
      newProgress = Math.max(1, Math.min(100, newProgress));
      
      // Solo aceptamos progreso superior al actual o al último válido,
      // excepto en errores que podríamos permitir pequeñas reducciones
      if (newProgress >= progress || newProgress >= lastValidProgressRef.current) {
        // Log para depuración
        console.log(`Actualizando progreso de ${progress}% a ${newProgress}%`);
        
        // Salir del modo de auto-incremento si estábamos en él
        if (autoIncrementRef.current) {
          console.log(`Saliendo del modo auto-increment con progreso real: ${newProgress}%`);
          autoIncrementRef.current = false;
        }
        
        // Guardar el último progreso válido
        lastValidProgressRef.current = Math.max(lastValidProgressRef.current, newProgress);
        
        // Actualizar progreso y registrar
        setProgress(newProgress);
        progressHistoryRef.current.push({time: now, value: newProgress});
      }
    }
  };

  // Manejar lógica de auto-incremento con mejoras
  const handleAutoIncrement = () => {
    const now = Date.now();
    const secondsSinceLastUpdate = (now - lastUpdateTimeRef.current) / 1000;
    
    // Si llevamos más de 3 segundos sin actualizaciones y estamos por debajo del 95%
    if (secondsSinceLastUpdate > 3 && progress < 95) {
      // Incrementar más rápido al inicio y más lento cuando nos acercamos al 95%
      const distanceToMax = 95 - progress;
      const increment = Math.max(0.2, distanceToMax / 40);
      
      // Limitar a un máximo de 95%
      const newProgress = Math.min(95, progress + increment);
      
      // Registrar que estamos en modo auto-incremento
      if (!autoIncrementRef.current) {
        console.log('Activando auto-increment mode por inactividad');
        autoIncrementRef.current = true;
      }
      
      console.log(`Auto-incrementando progreso: ${progress}% → ${newProgress}%`);
      setProgress(newProgress);
      
      // Registrar solo para análisis
      progressHistoryRef.current.push({time: now, value: newProgress});
      
      return newProgress;
    }
    
    return progress;
  };

  // Función para resetear completamente el progreso
  const resetProgress = () => {
    setProgress(1);
    setProcessedChunks(0);
    setTotalChunks(0);
    setSpeed(0);
    processedCharsRef.current = 0;
    totalCharsRef.current = 0;
    lastValidProgressRef.current = 1;
    progressHistoryRef.current = [];
    autoIncrementRef.current = false;
    lastUpdateTimeRef.current = Date.now();
    errorCountRef.current = 0;
    heartbeatCountRef.current = 0;
  };

  return {
    progress,
    setProgress,
    processedChunks,
    totalChunks,
    speed,
    updateProgress,
    handleAutoIncrement,
    resetProgress,
    lastUpdateTimeRef,
    progressHistoryRef,
    processedCharsRef,
    totalCharsRef,
    autoIncrementRef,
    lastValidProgressRef,
    errorCountRef
  };
};
