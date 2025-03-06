
import { useState, useCallback } from 'react';

export const useAudioState = () => {
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [conversionId, setConversionId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [conversionStartTime, setConversionStartTime] = useState<number | undefined>(undefined);

  // Wrap setState functions in useCallback to maintain stable references
  const setConversionStatusStable = useCallback((status: 'idle' | 'converting' | 'completed' | 'error') => {
    setConversionStatus(prev => {
      if (prev === status) return prev;
      return status;
    });
  }, []);

  const setProgressStable = useCallback((newProgress: number) => {
    setProgress(prev => {
      if (prev === newProgress) return prev;
      return newProgress;
    });
  }, []);

  const setAudioDataStable = useCallback((data: ArrayBuffer | null) => {
    setAudioData(prev => {
      if (prev === data) return prev;
      return data;
    });
  }, []);

  const setAudioDurationStable = useCallback((duration: number) => {
    setAudioDuration(prev => {
      if (prev === duration) return prev;
      return duration;
    });
  }, []);

  const setConversionIdStable = useCallback((id: string | null) => {
    setConversionId(prev => {
      if (prev === id) return prev;
      return id;
    });
  }, []);

  const setCurrentFileNameStable = useCallback((fileName: string | null) => {
    setCurrentFileName(prev => {
      if (prev === fileName) return prev;
      return fileName;
    });
  }, []);

  const setElapsedTimeStable = useCallback((time: number) => {
    setElapsedTime(prev => {
      if (prev === time) return prev;
      return time;
    });
  }, []);

  const setConversionStartTimeStable = useCallback((time: number | undefined) => {
    setConversionStartTime(prev => {
      if (prev === time) return prev;
      return time;
    });
  }, []);

  return {
    conversionStatus,
    setConversionStatus: setConversionStatusStable,
    progress,
    setProgress: setProgressStable,
    audioData,
    setAudioData: setAudioDataStable,
    audioDuration,
    setAudioDuration: setAudioDurationStable,
    conversionId,
    setConversionId: setConversionIdStable,
    currentFileName,
    setCurrentFileName: setCurrentFileNameStable,
    elapsedTime,
    setElapsedTime: setElapsedTimeStable,
    conversionStartTime,
    setConversionStartTime: setConversionStartTimeStable
  };
};
