
import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Chapter } from '@/utils/textExtraction';
import { ChaptersList } from './ChaptersList';
import { useConversionProgress } from '@/hooks/useConversionProgress';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/hooks/useLanguage';

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
  onProgressUpdate
}: ConversionStatusProps) => {
  const { translations } = useLanguage();
  const { 
    progress: currentProgress, 
    updateProgress,
    timeRemaining, 
    elapsedTime, 
    hasStarted,
    processedChunks,
    totalChunks,
    speed
  } = useConversionProgress(
    status,
    progress,
    estimatedSeconds,
    conversionId,
    textLength
  );

  // Añadimos este log para depuración
  React.useEffect(() => {
    console.log('ConversionStatus - Progress Update:', {
      status,
      externalProgress: progress,
      calculatedProgress: currentProgress,
      timeRemaining,
      elapsedTime,
      processedChunks,
      totalChunks
    });
  }, [progress, currentProgress, timeRemaining, elapsedTime, processedChunks, totalChunks, status]);

  // Actualizar el progreso cuando cambie
  React.useEffect(() => {
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

  const displayStatus = status === 'processing' ? 'converting' : status;
  
  const statusMessages = {
    idle: translations.readyToConvert,
    converting: translations.converting.replace('{fileType}', fileType),
    completed: translations.conversionCompleted,
    error: translations.conversionError,
    processing: translations.converting.replace('{fileType}', fileType)
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds || seconds <= 0) return "Calculando...";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    if (minutes === 0) return `${remainingSeconds}s`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderConvertingStatus = () => (
    <div className="flex flex-col items-center gap-4">
      <div className="relative inline-flex items-center justify-center">
        <Loader2 
          className="w-12 h-12 animate-spin text-primary" 
          strokeWidth={2.5}
        />
      </div>
      <p className="text-lg font-medium">
        {statusMessages[status]}
      </p>
      <div className="w-full space-y-3">
        <Progress 
          value={currentProgress} 
          className="w-full" 
          showPercentage={showPercentage} 
        />
        <div className="text-sm text-muted-foreground text-center space-y-1">
          <div>
            {elapsedTime > 0 && (
              <span>
                {translations.timeElapsed.replace('{time}', formatTime(elapsedTime))}
                {typeof timeRemaining === 'number' && (
                  <span> • {translations.timeRemaining.replace('{time}', formatTime(timeRemaining))}</span>
                )}
                {speed > 0 && (
                  <span> • {Math.round(speed)} chars/sec</span>
                )}
              </span>
            )}
          </div>
          {processedChunks > 0 && totalChunks > 0 && (
            <div>
              Processing chunk {processedChunks} of {totalChunks}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCompletedStatus = () => (
    <div className="w-full flex flex-col items-center justify-center gap-3">
      <CheckCircle2 className="w-12 h-12 text-green-500" />
      <p className="text-lg font-medium text-green-600 text-center">
        {statusMessages[status]}
      </p>
    </div>
  );

  const renderErrorStatus = () => (
    <Alert variant="destructive">
      <AlertCircle className="h-5 w-5" />
      <AlertDescription className="ml-2">
        {statusMessages[status]}
      </AlertDescription>
    </Alert>
  );

  const renderIdleStatus = () => (
    <p className="text-lg font-medium text-center">
      {statusMessages[status]}
    </p>
  );

  return (
    <div className="w-full max-w-md mx-auto bg-card p-6 rounded-lg shadow-sm space-y-6">
      <div className="flex justify-center w-full">
        {displayStatus === 'converting' && renderConvertingStatus()}
        {displayStatus === 'completed' && renderCompletedStatus()}
        {displayStatus === 'error' && renderErrorStatus()}
        {displayStatus === 'idle' && renderIdleStatus()}
      </div>
      
      <ChaptersList chapters={chapters} />
    </div>
  );
};

export default ConversionStatus;
