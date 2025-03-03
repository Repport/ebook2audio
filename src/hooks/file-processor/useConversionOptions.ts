
import { useState } from 'react';

export const useConversionOptions = () => {
  const [detectChapters, setDetectChapters] = useState<boolean>(false);
  const [detectingChapters, setDetectingChapters] = useState<boolean>(false);
  
  return {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    setDetectingChapters
  };
};
