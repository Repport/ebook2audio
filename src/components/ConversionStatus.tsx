
import React from 'react';
import { Loader2 } from 'lucide-react';
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
}

const ConversionStatus = ({ 
  status, 
  progress = 0, 
  fileType = 'EPUB',
  chaptersFound = 0,
  detectingChapters = false,
  chapters = [],
  estimatedSeconds = 0
}: ConversionStatusProps) => {
  const { smoothProgress, showEstimate, timeRemaining } = useConversionProgress(
    status,
    progress,
    estimatedSeconds
  );

  const displayStatus = status === 'processing' ? 'converting' : status;
  
  const statusMessages = {
    idle: 'Ready to convert',
    converting: `Converting ${fileType} to MP3...`,
    completed: 'Conversion completed!',
    error: 'Conversion error',
    processing: `Converting ${fileType} to MP3...`
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-center w-full">
        {(displayStatus === 'converting') && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-lg font-medium text-center animate-pulse">
              {statusMessages[status]}
            </p>
          </div>
        )}
        
        {displayStatus === 'completed' && (
          <p className="text-lg font-medium text-center text-green-600 dark:text-green-400">
            {statusMessages[status]}
          </p>
        )}

        {displayStatus === 'error' && (
          <Alert variant="destructive" className="w-full">
            <AlertDescription>
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
      
      {timeRemaining && showEstimate && (
        <p className="text-sm text-muted-foreground text-center">
          Estimated time remaining: {timeRemaining}
        </p>
      )}

      {detectingChapters && (
        <p className="text-sm text-muted-foreground text-center">
          Detecting chapters... {chaptersFound} chapters found
        </p>
      )}
      
      <ChaptersList chapters={chapters} />

      {(displayStatus === 'converting') && (
        <div className="w-full space-y-2">
          <Progress value={smoothProgress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            {Math.round(smoothProgress)}%
          </p>
        </div>
      )}
    </div>
  );
};

export default ConversionStatus;
