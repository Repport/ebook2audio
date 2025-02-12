
import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Chapter } from '@/utils/textExtraction';
import { ChaptersList } from './ChaptersList';
import { useConversionProgress } from '@/hooks/useConversionProgress';

interface ConversionStatusProps {
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing';
  progress?: number;
  fileType?: 'PDF' | 'EPUB';
  chaptersFound?: number;
  detectingChapters?: boolean;
  chapters?: Chapter[];
  estimatedSeconds?: number;
  conversionId?: string | null;
}

const ConversionStatus = ({ 
  status, 
  progress = 0, 
  fileType = 'EPUB',
  chaptersFound = 0,
  detectingChapters = false,
  chapters = [],
  estimatedSeconds = 0,
  conversionId
}: ConversionStatusProps) => {
  const { timeRemaining, elapsedTime, hasStarted } = useConversionProgress(
    status,
    progress,
    estimatedSeconds,
    conversionId
  );

  const displayStatus = status === 'processing' ? 'converting' : status;
  
  const statusMessages = {
    idle: 'Ready to convert',
    converting: `Converting ${fileType} to MP3...`,
    completed: 'Conversion completed!',
    error: 'Conversion error',
    processing: `Converting ${fileType} to MP3...`
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-center w-full mb-2">
        {(displayStatus === 'converting') && (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              {hasStarted && (
                <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {Math.round(progress)}%
                </div>
              )}
            </div>
            <p className="text-lg font-medium text-center">
              {statusMessages[status]}
            </p>
          </div>
        )}
        
        {displayStatus === 'completed' && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 dark:text-green-400" />
            <p className="text-lg font-medium text-center text-green-600 dark:text-green-400">
              {statusMessages[status]}
            </p>
          </div>
        )}

        {displayStatus === 'error' && (
          <Alert variant="destructive" className="w-full">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="ml-2">
              {statusMessages[status]}
            </AlertDescription>
          </Alert>
        )}

        {displayStatus === 'idle' && (
          <p className="text-lg font-medium text-center">
            {statusMessages[status]}
          </p>
        )}
      </div>
      
      {(displayStatus === 'converting' && hasStarted) && (
        <div className="w-full space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="text-center w-full">
              {timeRemaining && `${timeRemaining} remaining (${formatTime(elapsedTime)} elapsed)`}
            </div>
          </div>
        </div>
      )}
      
      <ChaptersList chapters={chapters} />
    </div>
  );
};

export default ConversionStatus;
