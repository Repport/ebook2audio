
import { useRef } from 'react';

export const useTimeTracking = () => {
  const startTimeRef = useRef(Date.now());
  const lastUpdateRef = useRef(Date.now());

  return {
    startTimeRef,
    lastUpdateRef
  };
};
