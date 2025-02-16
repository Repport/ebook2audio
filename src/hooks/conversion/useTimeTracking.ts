
import { useRef, useEffect } from 'react';

export const useTimeTracking = () => {
  const startTimeRef = useRef(Date.now());
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    // Reiniciar el tiempo de inicio cuando el componente se monta
    startTimeRef.current = Date.now();
    lastUpdateRef.current = Date.now();
  }, []);

  return {
    startTimeRef,
    lastUpdateRef
  };
};
