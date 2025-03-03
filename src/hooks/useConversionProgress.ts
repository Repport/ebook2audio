
import { useEffect } from 'react';
import { ChunkProgressData } from '@/services/conversion/types/chunks';
import { useTimeCalculation } from './conversion-progress/useTimeCalculation';
import { useProgressManagement } from './conversion-progress/useProgressManagement';
import { useErrorWarningManagement } from './conversion-progress/useErrorWarningManagement';

export const useConversionProgress = (
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing',
  initialProgress: number,
  estimatedSeconds: number,
  conversionId?: string | null,
  textLength?: number,
  initialElapsedTime?: number
) => {
  // Use our specialized hooks
  const timeCalculation = useTimeCalculation(
    status, 
    initialElapsedTime, 
    estimatedSeconds, 
    textLength
  );
  
  const progressManagement = useProgressManagement(initialProgress);
  
  const errorWarningManagement = useErrorWarningManagement();
  
  // Reset states when status changes to converting
  useEffect(() => {
    if (status === 'converting' || status === 'processing') {
      // Only reset these values if coming from completed or error
      if (['completed', 'error'].includes(status as string)) {
        progressManagement.setProgress(Math.max(1, initialProgress));
        errorWarningManagement.resetErrorsAndWarnings();
      }
    } 
    else if (status === 'completed') {
      // Ensure progress is at 100% when completed
      progressManagement.setProgress(100);
    }
  }, [status, initialProgress]);

  // Update initial progress when it changes
  useEffect(() => {
    if (initialProgress > progressManagement.progress) {
      progressManagement.setProgress(Math.max(1, initialProgress));
    }
  }, [initialProgress, progressManagement.progress]);

  // Timer for updating elapsed time and auto progress
  useEffect(() => {
    let intervalId: number;
    
    if (status === 'converting' || status === 'processing') {
      intervalId = window.setInterval(() => {
        const now = Date.now();
        
        // Calculate elapsed time since start (preserving previous)
        const elapsed = Math.floor((now - timeCalculation.startTimeRef.current) / 1000);
        
        // Update both references
        timeCalculation.setElapsedTime(elapsed);
        timeCalculation.elapsedTimeRef.current = elapsed;
        
        // Handle auto-increment for progress
        const newProgress = progressManagement.handleAutoIncrement();
        
        // Update time remaining
        timeCalculation.updateTimeRemaining(newProgress);
        
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [status, progressManagement.progress, estimatedSeconds, textLength, timeCalculation.elapsedTime]);

  // Main function to process updates
  const updateProgress = (data: ChunkProgressData) => {
    // Update progress values
    progressManagement.updateProgress(data, timeCalculation.elapsedTime);
    
    // Update errors and warnings
    errorWarningManagement.updateErrorsAndWarnings(data);
    
    // Update time remaining if there's a significant progress change
    if (data.progress && Math.abs(data.progress - progressManagement.progress) > 2) {
      timeCalculation.updateTimeRemaining(data.progress);
    }
  };

  return {
    progress: progressManagement.progress,
    updateProgress,
    elapsedTime: timeCalculation.elapsedTime,
    timeRemaining: timeCalculation.timeRemaining,
    hasStarted: timeCalculation.elapsedTime > 2 || progressManagement.progress > 1,
    processedChunks: progressManagement.processedChunks,
    totalChunks: progressManagement.totalChunks,
    speed: progressManagement.speed,
    errors: errorWarningManagement.errors,
    warnings: errorWarningManagement.warnings
  };
};
