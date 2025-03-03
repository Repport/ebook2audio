
import { useState } from 'react';

export const useAudioState = () => {
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [conversionId, setConversionId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [conversionStartTime, setConversionStartTime] = useState<number | undefined>(undefined);

  return {
    conversionStatus,
    setConversionStatus,
    progress,
    setProgress,
    audioData,
    setAudioData,
    audioDuration,
    setAudioDuration,
    conversionId,
    setConversionId,
    currentFileName,
    setCurrentFileName,
    elapsedTime,
    setElapsedTime,
    conversionStartTime,
    setConversionStartTime
  };
};
