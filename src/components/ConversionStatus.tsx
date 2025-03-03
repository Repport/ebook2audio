
import React, { useEffect, useRef } from 'react';
import { Chapter } from '@/utils/textExtraction';
import { ChaptersList } from './ChaptersList';
import { useConversionProgress } from '@/hooks/useConversionProgress';
import { useLanguage } from '@/hooks/useLanguage';
import { ConversionStatusType } from './conversion-status/conversion-status-types';

// Import our components
import ConversionStatusIdle from './conversion-status/ConversionStatusIdle';
import ConversionStatusError from './conversion-status/ConversionStatusError';
import ConversionStatusCompleted from './conversion-status/ConversionStatusCompleted';
import ConversionStatusConverting from './conversion-status/ConversionStatusConverting';

interface ConversionStatusProps {
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing';
  progress?: number;
  fileType?: 'PDF' | 'EPUB';
  chaptersFound?: number;
  detectingChapters?: boolean;
  chapters?: Chapter[];
  estimatedSeconds?: number;
  conversionId?: string | null;
  textLength?: number;
  showPercentage?: boolean;
  onProgressUpdate?: (data: any) => void;
  initialElapsedTime?: number;
}

const ConversionStatus = ({
  status,
  progress = 0,
  fileType = 'EPUB',
  chapters = [],
  estimatedSeconds = 0,
  conversionId,
  textLength = 0,
  showPercentage = true,
  initialElapsedTime = 0,
  onProgressUpdate
}: ConversionStatusProps) => {
  const { translations } = useLanguage();
  const isMountedRef = useRef(true);
  
  // For consistency if the state is processing but the UI component shows "converting"
  const displayStatus = status === 'processing' ? 'converting' : status;

  // Use improved progress hook
  const {
    progress: currentProgress,
    updateProgress,
    timeRemaining,
    elapsedTime,
    hasStarted,
    processedChunks,
    totalChunks,
    speed,
    errors,
    warnings
  } = useConversionProgress(
    status, 
    progress, 
    estimatedSeconds, 
    conversionId, 
    textLength, 
    initialElapsedTime
  );

  // Handle component lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Debug logging
  useEffect(() => {
    if (isMountedRef.current) {
      console.log('ConversionStatus - Progress Update:', {
        status,
        externalProgress: progress,
        calculatedProgress: currentProgress,
        timeRemaining,
        elapsedTime,
        initialElapsedTime,
        processedChunks,
        totalChunks,
        hasErrors: errors.length > 0,
        hasWarnings: warnings.length > 0
      });
    }
  }, [progress, currentProgress, timeRemaining, elapsedTime, initialElapsedTime, processedChunks, totalChunks, status, errors.length, warnings.length]);

  // Notify updates upstream - only if component is still mounted
  useEffect(() => {
    if (isMountedRef.current && onProgressUpdate) {
      try {
        onProgressUpdate({
          progress: currentProgress,
          processedChunks,
          totalChunks,
          elapsedTime,
          speed
        });
      } catch (e) {
        console.error('Error in progress update callback:', e);
      }
    }
  }, [currentProgress, processedChunks, totalChunks, elapsedTime, speed, onProgressUpdate]);

  // Status messages (without reference to file type)
  const statusMessages = {
    idle: translations.readyToConvert || "Ready to convert",
    converting: translations.converting?.replace('{fileType}', '') || "Converting...",
    completed: translations.conversionCompleted || "Conversion completed",
    error: translations.conversionError || "Conversion error",
    processing: translations.converting?.replace('{fileType}', '') || "Processing..."
  };

  // Return the appropriate component based on status
  if (displayStatus === 'converting') {
    return (
      <ConversionStatusConverting
        message={statusMessages[displayStatus]}
        progress={currentProgress}
        elapsedTime={elapsedTime}
        timeRemaining={timeRemaining}
        processedChunks={processedChunks}
        totalChunks={totalChunks}
        warnings={warnings}
        errors={errors}
        showPercentage={showPercentage}
      />
    );
  } else if (displayStatus === 'completed') {
    return (
      <ConversionStatusCompleted
        message={statusMessages[displayStatus]}
        warnings={warnings}
        errors={errors}
      />
    );
  } else if (displayStatus === 'error') {
    return (
      <ConversionStatusError
        message={statusMessages[displayStatus]}
      />
    );
  } else {
    return (
      <ConversionStatusIdle
        message={statusMessages[displayStatus]}
      />
    );
  }
};

export default ConversionStatus;
