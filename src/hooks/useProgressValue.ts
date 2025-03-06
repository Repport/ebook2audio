
import { useState, useEffect, useRef } from 'react';

interface UseProgressValueProps {
  value?: number;
  status?: 'idle' | 'converting' | 'error' | 'success';
  animationDuration?: number;
}

/**
 * Hook for smoothly animating progress values
 */
export function useProgressValue({
  value = 0,
  status = 'idle',
  animationDuration = 300
}: UseProgressValueProps = {}) {
  // For visual rendering - smoothly transitions between values
  const [displayValue, setDisplayValue] = useState(value);
  
  // For tracking the latest value and animation state
  const lastValueRef = useRef(value);
  const animationFrameRef = useRef<number | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);
  
  // Clean up any animations on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Update the displayValue when the input value changes
  useEffect(() => {
    // Skip invalid values
    if (value === undefined || value === null || isNaN(value)) {
      return;
    }
    
    // Ensure value is in valid range
    const targetValue = Math.max(0, Math.min(100, value));
    
    // Skip if value hasn't changed
    if (targetValue === lastValueRef.current) {
      return;
    }
    
    // Cancel any ongoing animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Store the current animation start time
    animationStartTimeRef.current = performance.now();
    
    // Define the animation function
    const animate = (timestamp: number) => {
      if (!animationStartTimeRef.current) {
        animationStartTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - animationStartTimeRef.current;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      const startValue = lastValueRef.current;
      const newValue = startValue + (targetValue - startValue) * progress;
      
      setDisplayValue(newValue);
      
      if (progress < 1) {
        // Continue animation
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        lastValueRef.current = targetValue;
        animationFrameRef.current = null;
        animationStartTimeRef.current = null;
      }
    };
    
    // Start the animation
    animationFrameRef.current = requestAnimationFrame(animate);
    
  }, [value, animationDuration]);

  return {
    displayValue,
    isAnimating: animationFrameRef.current !== null
  };
}
