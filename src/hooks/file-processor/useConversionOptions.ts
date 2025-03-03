
import { useState } from 'react';

export const useConversionOptions = () => {
  const [detectChapters, setDetectChapters] = useState(true);
  const [detectingChapters, setDetectingChapters] = useState(false);
  
  return {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    setDetectingChapters
  };
};
