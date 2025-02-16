
import { useRef, useEffect } from 'react';

export const useTimeTracking = () => {
  const startTimeRef = useRef<number>(Date.now());
  const lastUpdateRef = useRef<number>(Date.now());

  console.log('⏱️ Time tracking initialized:', {
    startTime: new Date(startTimeRef.current).toISOString(),
    lastUpdate: new Date(lastUpdateRef.current).toISOString()
  });

  // Reset timers when component mounts
  useEffect(() => {
    startTimeRef.current = Date.now();
    lastUpdateRef.current = Date.now();
    
    return () => {
      console.log('⏱️ Time tracking cleanup:', {
        totalDuration: (Date.now() - startTimeRef.current) / 1000,
        lastUpdateAge: (Date.now() - lastUpdateRef.current) / 1000
      });
    };
  }, []);

  return {
    startTimeRef,
    lastUpdateRef
  };
};
