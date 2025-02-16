
import { useRef, useEffect } from 'react';

export const useTimeTracking = () => {
  const startTimeRef = useRef<number>(Date.now());
  const lastUpdateRef = useRef<number>(Date.now());

  // Format dates for better logging
  const startTimeFormatted = new Date(startTimeRef.current).toISOString();
  const lastUpdateFormatted = new Date(lastUpdateRef.current).toISOString();

  console.log('⏱️ Time tracking initialized:', JSON.stringify({
    startTime: startTimeFormatted,
    lastUpdate: lastUpdateFormatted,
    timestamp: new Date().toISOString()
  }, null, 2));

  // Reset timers when component mounts
  useEffect(() => {
    startTimeRef.current = Date.now();
    lastUpdateRef.current = Date.now();
    
    return () => {
      const totalDuration = (Date.now() - startTimeRef.current) / 1000;
      const lastUpdateAge = (Date.now() - lastUpdateRef.current) / 1000;
      
      console.log('⏱️ Time tracking cleanup:', JSON.stringify({
        totalDuration: `${totalDuration.toFixed(1)}s`,
        lastUpdateAge: `${lastUpdateAge.toFixed(1)}s`,
        timestamp: new Date().toISOString()
      }, null, 2));
    };
  }, []);

  return {
    startTimeRef,
    lastUpdateRef
  };
};
