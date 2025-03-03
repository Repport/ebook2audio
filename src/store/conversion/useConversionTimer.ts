
import React from 'react';
import { useConversionStore } from '../conversionStore';

/**
 * Hook para el timer de actualización automática del tiempo de conversión
 */
export const useConversionTimer = () => {
  const updateElapsedTime = useConversionStore(state => state.updateElapsedTime);
  const status = useConversionStore(state => state.status);
  const startTime = useConversionStore(state => state.time.startTime);
  
  React.useEffect(() => {
    let timerId: number | undefined;
    
    if ((status === 'converting' || status === 'processing') && startTime) {
      timerId = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        updateElapsedTime(elapsed, startTime);
      }, 1000);
    }
    
    return () => {
      if (timerId) {
        window.clearInterval(timerId);
      }
    };
  }, [status, updateElapsedTime, startTime]);
};
