
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
};
