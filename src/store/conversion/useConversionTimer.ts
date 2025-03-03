
import React from 'react';
import { useConversionStore } from '../conversionStore';

/**
 * Hook para el timer de actualización automática del tiempo de conversión
 */
export const useConversionTimer = () => {
  const updateTime = useConversionStore(state => state.updateTime);
  const status = useConversionStore(state => state.status);
  
  React.useEffect(() => {
    let timerId: number | undefined;
    
    if (status === 'converting' || status === 'processing') {
      timerId = window.setInterval(() => {
        updateTime();
      }, 1000);
    }
    
    return () => {
      if (timerId) {
        window.clearInterval(timerId);
      }
    };
  }, [status, updateTime]);
};
