
import { useState, useEffect } from 'react';

interface ProgressValueProps {
  value: number;
  status: "idle" | "converting" | "error" | "success";
  animationDuration?: number;
}

export const useProgressValue = ({
  value,
  status,
  animationDuration = 200,
}: ProgressValueProps) => {
  const [displayValue, setDisplayValue] = useState(value || 0);

  useEffect(() => {
    // Special case for error status - always show 100%
    if (status === 'error') {
      setDisplayValue(100);
      return;
    }
    
    // Special case for completed status - always show 100%
    if (status === 'success' || status === 'completed') {
      setDisplayValue(100);
      return;
    }
    
    // Skip animation for initial state or large jumps
    if (value === 0 || Math.abs(displayValue - value) > 30) {
      setDisplayValue(value);
      return;
    }

    // Animate smooth progress changes
    const timeout = setTimeout(() => {
      setDisplayValue(prev => {
        // Move towards target value
        if (Math.abs(prev - value) < 0.5) return value;
        return prev + (value > prev ? 0.5 : -0.5);
      });
    }, animationDuration / ((Math.abs(displayValue - value) * 2) || 1));

    return () => clearTimeout(timeout);
  }, [value, displayValue, animationDuration, status]);

  return { displayValue };
};
