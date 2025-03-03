
import React, { useEffect } from 'react';
import { Chapter } from '@/utils/textExtraction';
import { ChaptersList } from './ChaptersList';
import { useConversionProgress } from '@/hooks/useConversionProgress';
import { useLanguage } from '@/hooks/useLanguage';
import { ConversionStatusType } from './conversion-status/conversion-status-types';

// Import our new components
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

  // Debug logging
  useEffect(() => {
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
  }, [progress, currentProgress, timeRemaining, elapsedTime, initialElapsedTime, processedChunks, totalChunks, status, errors.length, warnings.length]);

  // Notify updates upstream
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate({
        progress: currentProgress,
        processedChunks,
        totalChunks,
        elapsedTime,
        speed
      });
    }
  }, [currentProgress, processedChunks, totalChunks, elapsedTime, speed, onProgressUpdate]);

  // Status messages (without reference to file type)
  const statusMessages = {
    idle: translations.readyToConvert,
    converting: translations.converting.replace('{fileType}', ''),
    completed: translations.conversionCompleted,
    error: translations.conversionError,
    processing: translations.converting.replace('{fileType}', '')
  };

  // Return the appropriate component based on status
  if (displayStatus === 'converting' || displayStatus === 'processing') {
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
