
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
}

const ConversionStatus = ({ 
  status, 
  progress = 0, 
  fileType = 'EPUB',
  chapters = [],
  estimatedSeconds = 0,
  conversionId,
  textLength = 0
}: ConversionStatusProps) => {
  const { translations } = useLanguage();
  const { 
    progress: currentProgress, 
    timeRemaining, 
    elapsedTime, 
    hasStarted,
    processedCharacters,
    totalCharacters 
  } = useConversionProgress(
    status,
    progress,
    estimatedSeconds,
    conversionId,
    textLength
  );

  const displayStatus = status === 'processing' ? 'converting' : status;
  
  const statusMessages = {
    idle: translations.readyToConvert,
    converting: translations.converting.replace('{fileType}', fileType),
    completed: translations.conversionCompleted,
    error: translations.conversionError,
    processing: translations.converting.replace('{fileType}', fileType)
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderConvertingStatus = () => (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Loader2 
          className="w-12 h-12 animate-spin text-primary" 
          strokeWidth={2.5}
        />
        {hasStarted && currentProgress > 0 && (
          <span className="absolute -bottom-1 -right-1 bg-primary text-white text-xs font-medium px-2 py-0.5 rounded-full">
            {Math.round(currentProgress)}%
          </span>
        )}
      </div>
      <p className="text-lg font-medium">
        {statusMessages[status]}
      </p>
      <div className="w-full space-y-3">
        <Progress value={currentProgress} className="w-full" />
        <div className="text-sm text-muted-foreground text-center space-y-1">
          {totalCharacters > 0 && (
            <div>
              {translations.processingChunk
                .replace('{current}', processedCharacters.toString())
                .replace('{total}', totalCharacters.toString())}
            </div>
          )}
          <div>
            {elapsedTime > 0 && translations.timeElapsed.replace('{time}', formatTime(elapsedTime))}
            {timeRemaining && ` • ${translations.timeRemaining.replace('{time}', timeRemaining)}`}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompletedStatus = () => (
    <div className="flex flex-col items-center gap-3">
      <CheckCircle2 className="w-12 h-12 text-green-500" />
      <p className="text-lg font-medium text-green-600">
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
    <div className="w-full max-w-md bg-card p-6 rounded-lg shadow-sm space-y-6">
      <div className="flex justify-center">
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
