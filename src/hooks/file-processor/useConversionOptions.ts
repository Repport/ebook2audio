
import { useState } from 'react';

export function useChaptersDetection() {
  const [detectChapters, setDetectChapters] = useState(true);
  const [detectingChapters, setDetectingChapters] = useState(false);
  
  return {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    setDetectingChapters
  };
}

export function useConversionOptions() {
  const { detectChapters, setDetectChapters, detectingChapters, setDetectingChapters } = useChaptersDetection();
  
  return {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    setDetectingChapters
  };
}
