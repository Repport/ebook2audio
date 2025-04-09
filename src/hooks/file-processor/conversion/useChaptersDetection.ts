
import { useState } from 'react';

export const useChaptersDetection = () => {
  const [detectChapters, setDetectChapters] = useState(true);
  const [detectingChapters, setDetectingChapters] = useState(false);

  return {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    setDetectingChapters
  };
};
