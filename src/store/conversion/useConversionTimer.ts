
import React from 'react';
import { useConversionStore } from '../conversionStore';

/**
 * Hook for automatic conversion time updates
 */
export const useConversionTimer = () => {
  const updateElapsedTime = useConversionStore(state => state.updateElapsedTime);
  const status = useConversionStore(state => state.status);
  const startTime = useConversionStore(state => state.time.startTime);
  
  // Store timer ID in a ref to avoid it being part of dependency array
  const timerRef = React.useRef<number | null>(null);
  
  // Track if the timer is already running to prevent duplicate timers
  const isRunningRef = React.useRef(false);
  
  React.useEffect(() => {
    // Clear any existing timer
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
      isRunningRef.current = false;
    }
    
    // Only start a new timer if we're in an active conversion state and have a startTime
    const isActiveConversion = (status === 'converting' || status === 'processing');
    
    if (isActiveConversion && startTime && !isRunningRef.current) {
      isRunningRef.current = true;
      
      console.log('Starting conversion timer');
      
      // Set initial value immediately to avoid delay
      const initialElapsed = Math.floor((Date.now() - startTime) / 1000);
      updateElapsedTime(initialElapsed, startTime);
      
      // Set up the interval
      timerRef.current = window.setInterval(() => {
        if (!isRunningRef.current) return; // Safety check
        
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        updateElapsedTime(elapsed, startTime);
      }, 1000);
    }
    
    // Cleanup function to clear interval when component unmounts or status changes
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
        isRunningRef.current = false;
      }
    };
  }, [status, updateElapsedTime, startTime]);
};
