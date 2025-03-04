
import React from 'react';
import { useConversionStore } from '../conversionStore';

/**
 * Hook para el timer de actualización automática del tiempo de conversión
 */
export const useConversionTimer = () => {
  const updateElapsedTime = useConversionStore(state => state.updateElapsedTime);
  const status = useConversionStore(state => state.status);
  const startTime = useConversionStore(state => state.time.startTime);
  
  // Store timer ID in a ref to avoid it being part of dependency array
  const timerRef = React.useRef<number>();
  
  React.useEffect(() => {
    // Clear any existing timer first to prevent duplicates
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    
    // Only start a new timer if we're in an active conversion state and have a startTime
    if ((status === 'converting' || status === 'processing') && startTime) {
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        updateElapsedTime(elapsed, startTime);
      }, 1000);
    }
    
    // Cleanup function to clear interval when component unmounts or status changes
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [status, updateElapsedTime, startTime]);
};
