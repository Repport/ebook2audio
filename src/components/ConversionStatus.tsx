
import React, { useEffect, useRef, useState } from 'react';
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
  const progressUpdateTimeoutRef = useRef<number | null>(null);
  const [stableStatus, setStableStatus] = useState(status);
  const [initialRenderCompleted, setInitialRenderCompleted] = useState(false);
  
  // Para mejor depuración
  useEffect(() => {
    console.log(`ConversionStatus - Status changed from ${stableStatus} to ${status}, progress: ${progress}%`);
  }, [status, stableStatus, progress]);
  
  // Para asegurar que el progreso inicial sea visible inmediatamente
  useEffect(() => {
    if (!initialRenderCompleted && (status === 'converting' || status === 'processing')) {
      console.log('ConversionStatus - Initial render with conversion status, ensuring progress visibility');
      setInitialRenderCompleted(true);
    }
  }, [status, initialRenderCompleted]);
  
  // For consistency if the state is processing but the UI component shows "converting"
  const displayStatus = status === 'processing' ? 'converting' : status;

  // Make status changes slightly delayed to avoid flashing UI during quick status changes
  useEffect(() => {
    if (status !== stableStatus) {
      // Reducimos el retraso a 150ms para una respuesta más rápida
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setStableStatus(status);
          console.log(`ConversionStatus - stableStatus updated to ${status}`);
        }
      }, 100); // Reducido de 150ms a 100ms
      
      return () => clearTimeout(timer);
    }
  }, [status, stableStatus]);

  // Use improved progress hook - aseguramos un progreso inicial mínimo
  const safeInitialProgress = Math.max(1, progress);
  
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
    stableStatus, 
    safeInitialProgress, 
    estimatedSeconds, 
    conversionId, 
    textLength, 
    initialElapsedTime
  );

  // Handle component lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    console.log('ConversionStatus - Component mounted');
    
    return () => {
      isMountedRef.current = false;
      console.log('ConversionStatus - Component unmounted');
      
      // Clear any pending timeouts
      if (progressUpdateTimeoutRef.current) {
        window.clearTimeout(progressUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Debug logging
  useEffect(() => {
    if (isMountedRef.current) {
      console.log('ConversionStatus - Status Update:', {
        status,
        stableStatus,
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
  }, [progress, currentProgress, timeRemaining, elapsedTime, initialElapsedTime, 
      processedChunks, totalChunks, status, stableStatus, errors.length, warnings.length]);

  // Notify updates upstream - only if component is still mounted, with debounce
  useEffect(() => {
    if (isMountedRef.current && onProgressUpdate) {
      try {
        // Debounce progress updates to avoid overwhelming the parent component
        if (progressUpdateTimeoutRef.current) {
          window.clearTimeout(progressUpdateTimeoutRef.current);
        }
        
        // Reducimos el debounce a 100ms para una actualización más frecuente
        // Using window.setTimeout to ensure it's globally available
        progressUpdateTimeoutRef.current = window.setTimeout(() => {
          if (isMountedRef.current) {
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
            progressUpdateTimeoutRef.current = null;
          }
        }, 100); // Debounce for 100ms (reduced from 250ms)
      } catch (e) {
        console.error('Error setting up progress update:', e);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (progressUpdateTimeoutRef.current) {
        window.clearTimeout(progressUpdateTimeoutRef.current);
        progressUpdateTimeoutRef.current = null;
      }
    };
    
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
