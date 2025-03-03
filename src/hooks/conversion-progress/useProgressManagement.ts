
import { useState, useRef, useEffect } from 'react';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

export const useProgressManagement = (initialProgress: number = 0) => {
  const [progress, setProgress] = useState<number>(Math.max(1, initialProgress));
  const [processedChunks, setProcessedChunks] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  
  // Referencias para persistent data
  const progressHistoryRef = useRef<{time: number, value: number}[]>([]);
  const processedCharsRef = useRef<number>(0);
  const totalCharsRef = useRef<number>(0);
  const autoIncrementRef = useRef<boolean>(false);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const errorCountRef = useRef<number>(0);
  const lastValidProgressRef = useRef<number>(Math.max(1, initialProgress));

  // Inicializar el progreso mínimo garantizado
  useEffect(() => {
    if (progress < 1) {
      console.log('Garantizando progreso mínimo del 1%');
      setProgress(1);
    }
  }, []);

  // Process progress updates
  const updateProgress = (
    data: ChunkProgressData,
    elapsedTime: number
  ) => {
    if (!data) return;
    
    // Mark time of this update
    const now = Date.now();
    lastUpdateTimeRef.current = now;
    
    // Log for debugging
    console.log('Progress update received:', {
      progress: data.progress,
      processedChunks: data.processedChunks,
      totalChunks: data.totalChunks,
      processedChars: data.processedCharacters,
      totalChars: data.totalCharacters,
      isCompleted: data.isCompleted,
      hasError: !!data.error
    });
    
    // If we receive completed signal, go to 100%
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
    
    // Update chunk counters if available
    if (typeof data.processedChunks === 'number' && typeof data.totalChunks === 'number') {
      setProcessedChunks(data.processedChunks);
      setTotalChunks(data.totalChunks);
      
      // Si tenemos chunks pero no caracteres, calculamos progreso basado en chunks
      if (!data.processedCharacters && !data.progress) {
        const chunkProgress = Math.round((data.processedChunks / data.totalChunks) * 100);
        
        // Solo si es mayor que el progreso actual o el último válido
        if (chunkProgress > progress || chunkProgress > lastValidProgressRef.current) {
          console.log(`Actualizando progreso basado en chunks: ${chunkProgress}%`);
          setProgress(Math.max(1, chunkProgress));
          lastValidProgressRef.current = Math.max(lastValidProgressRef.current, chunkProgress);
        }
      }
    }
    
    // Update character counters if available
    if (typeof data.processedCharacters === 'number') {
      processedCharsRef.current = data.processedCharacters;
    }
    
    if (typeof data.totalCharacters === 'number' && data.totalCharacters > 0) {
      totalCharsRef.current = data.totalCharacters;
    }
    
    // Update speed if we have character data
    if (processedCharsRef.current > 0 && elapsedTime > 0) {
      const charsPerSecond = processedCharsRef.current / Math.max(1, elapsedTime);
      setSpeed(charsPerSecond);
    }
    
    // Determine new progress value
    let newProgress: number | undefined;
    
    // 1. Use direct progress if available
    if (typeof data.progress === 'number' && !isNaN(data.progress)) {
      newProgress = data.progress;
    }
    // 2. Calculate based on characters if available
    else if (processedCharsRef.current > 0 && totalCharsRef.current > 0) {
      newProgress = Math.round((processedCharsRef.current / totalCharsRef.current) * 100);
    }
    // 3. Calculate based on chunks if available (redundante pero por seguridad)
    else if (data.processedChunks && data.totalChunks) {
      newProgress = Math.round((data.processedChunks / data.totalChunks) * 100);
    }
    
    // If we have a valid value, update progress
    if (typeof newProgress === 'number' && !isNaN(newProgress)) {
      // Limit between 1% and 100%
      newProgress = Math.max(1, Math.min(100, newProgress));
      
      // Modificamos esta lógica para ser más sensible a cambios pequeños
      // Solo aceptamos progreso superior al actual o al último válido,
      // excepto en errores que podríamos permitir pequeñas reducciones
      if (newProgress >= progress || newProgress >= lastValidProgressRef.current) {
        // Log for debugging
        console.log(`Updating progress from ${progress}% to ${newProgress}%`);
        
        // Exit auto-increment mode if we were in it
        if (autoIncrementRef.current) {
          console.log(`Exiting auto-increment mode with real progress: ${newProgress}%`);
          autoIncrementRef.current = false;
        }
        
        // Guardar el último progreso válido
        lastValidProgressRef.current = Math.max(lastValidProgressRef.current, newProgress);
        
        // Update progress and record
        setProgress(newProgress);
        progressHistoryRef.current.push({time: now, value: newProgress});
      }
    }
  };

  // Handle auto-increment logic with mejoras
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
      
      // Record that we're in auto-increment mode
      if (!autoIncrementRef.current) {
        console.log('Activando auto-increment mode por inactividad');
        autoIncrementRef.current = true;
      }
      
      console.log(`Auto-incrementing progress: ${progress}% → ${newProgress}%`);
      setProgress(newProgress);
      
      // Only record for analysis
      progressHistoryRef.current.push({time: now, value: newProgress});
      
      return newProgress;
    }
    
    return progress;
  };

  return {
    progress,
    setProgress,
    processedChunks,
    totalChunks,
    speed,
    updateProgress,
    handleAutoIncrement,
    lastUpdateTimeRef,
    progressHistoryRef,
    processedCharsRef,
    totalCharsRef,
    autoIncrementRef,
    lastValidProgressRef,
    errorCountRef
  };
};
