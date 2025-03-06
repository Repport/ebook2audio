
import { useEffect, useRef } from 'react';
import { useConversionStore } from '../conversionStore';

/**
 * Hook para actualizaciones automáticas del tiempo de conversión
 */
export const useConversionTimer = () => {
  const updateElapsedTime = useConversionStore(state => state.updateElapsedTime);
  const status = useConversionStore(state => state.status);
  const startTime = useConversionStore(state => state.time.startTime);
  
  // Almacenar el ID del temporizador en una ref para evitar que sea parte del array de dependencias
  const timerRef = useRef<number | null>(null);
  
  // Rastrear si el temporizador ya está en ejecución para evitar temporizadores duplicados
  const isRunningRef = useRef(false);
  
  useEffect(() => {
    // Solo iniciar el temporizador si estamos en un estado activo y tenemos startTime
    const isActiveConversion = (status === 'converting' || status === 'processing');
    
    // Limpiar cualquier temporizador existente primero
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
      isRunningRef.current = false;
    }
    
    if (isActiveConversion && startTime && !isRunningRef.current) {
      isRunningRef.current = true;
      
      // Establecer valor inicial inmediatamente para evitar retrasos
      const initialElapsed = Math.floor((Date.now() - startTime) / 1000);
      updateElapsedTime(initialElapsed, startTime);
      
      // Configurar el intervalo
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        updateElapsedTime(elapsed, startTime);
      }, 1000);
    }
    
    // Función de limpieza para borrar el intervalo cuando el componente se desmonta o el estado cambia
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
        isRunningRef.current = false;
      }
    };
  }, [status, startTime, updateElapsedTime]);
};
