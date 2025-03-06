
import { useState, useCallback, useRef } from 'react';

export const useAudioState = () => {
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [conversionId, setConversionId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [conversionStartTime, setConversionStartTime] = useState<number | undefined>(undefined);

  // Use refs to track previous values to prevent unnecessary state updates
  const prevConversionStatus = useRef(conversionStatus);
  const prevProgress = useRef(progress);
  const prevAudioData = useRef(audioData);
  const prevAudioDuration = useRef(audioDuration);
  const prevConversionId = useRef(conversionId);
  const prevCurrentFileName = useRef(currentFileName);
  const prevElapsedTime = useRef(elapsedTime);
  const prevConversionStartTime = useRef(conversionStartTime);

  // Wrap setState functions in useCallback to maintain stable references and prevent unnecessary updates
  const setConversionStatusStable = useCallback((status: 'idle' | 'converting' | 'completed' | 'error') => {
    if (status === prevConversionStatus.current) return; // Skip if unchanged
    prevConversionStatus.current = status;
    setConversionStatus(status);
  }, []);

  const setProgressStable = useCallback((newProgress: number) => {
    if (newProgress === prevProgress.current) return; // Skip if unchanged
    prevProgress.current = newProgress;
    setProgress(newProgress);
  }, []);

  const setAudioDataStable = useCallback((data: ArrayBuffer | null) => {
    if (data === prevAudioData.current) return; // Skip if unchanged
    prevAudioData.current = data;
    setAudioData(data);
  }, []);

  const setAudioDurationStable = useCallback((duration: number) => {
    if (duration === prevAudioDuration.current) return; // Skip if unchanged
    prevAudioDuration.current = duration;
    setAudioDuration(duration);
  }, []);

  const setConversionIdStable = useCallback((id: string | null) => {
    if (id === prevConversionId.current) return; // Skip if unchanged
    prevConversionId.current = id;
    setConversionId(id);
  }, []);

  const setCurrentFileNameStable = useCallback((fileName: string | null) => {
    if (fileName === prevCurrentFileName.current) return; // Skip if unchanged
    prevCurrentFileName.current = fileName;
    setCurrentFileName(fileName);
  }, []);

  const setElapsedTimeStable = useCallback((time: number) => {
    if (time === prevElapsedTime.current) return; // Skip if unchanged
    prevElapsedTime.current = time;
    setElapsedTime(time);
  }, []);

  const setConversionStartTimeStable = useCallback((time: number | undefined) => {
    if (time === prevConversionStartTime.current) return; // Skip if unchanged
    prevConversionStartTime.current = time;
    setConversionStartTime(time);
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
