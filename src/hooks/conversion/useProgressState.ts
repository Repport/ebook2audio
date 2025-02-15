
import { useState } from 'react';

export const useProgressState = (initialProgress: number) => {
  const [progress, setProgress] = useState(initialProgress);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [processedChunks, setProcessedChunks] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  return {
    progress,
    setProgress,
    elapsedTime,
    setElapsedTime,
    processedChunks,
    setProcessedChunks,
    totalChunks,
    setTotalChunks
  };
};
