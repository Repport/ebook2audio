
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Chapter } from '@/utils/textExtraction';
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [smoothProgress, setSmoothProgress] = useState(progress);
  const [showEstimate, setShowEstimate] = useState(true);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Smooth progress transition
  useEffect(() => {
    if (progress > smoothProgress) {
      const interval = setInterval(() => {
        setSmoothProgress(prev => {
          const next = Math.min(prev + 1, progress);
          if (next === progress) clearInterval(interval);
          return next;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [progress, smoothProgress]);

  // Reset progress and start time when status changes
  useEffect(() => {
    if (status === 'idle') {
      setSmoothProgress(0);
      setShowEstimate(true);
      setStartTime(null);
    } else if (status === 'converting' && !startTime) {
      setStartTime(Date.now());
    }
  }, [status, startTime]);

  // Hide estimate after 30 seconds to avoid showing stale data
  useEffect(() => {
    if (status === 'converting') {
      const timer = setTimeout(() => setShowEstimate(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const displayStatus = status === 'processing' ? 'converting' : status;
  
  const statusMessages = {
    idle: 'Ready to convert',
    converting: `Converting ${fileType} to MP3...`,
    completed: 'Conversion completed!',
    error: 'Conversion error',
    processing: `Converting ${fileType} to MP3...`
  };

  const formatTimestamp = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)} seconds`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    if (minutes < 60) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEstimatedTimeRemaining = () => {
    if (displayStatus !== 'converting' || smoothProgress >= 100 || !startTime) {
      return null;
    }
    
    const elapsedTime = (Date.now() - startTime) / 1000; // Convert to seconds
    const progressRate = smoothProgress / elapsedTime; // Progress per second
    
    if (progressRate <= 0) return null;
    
    const remainingProgress = 100 - smoothProgress;
    const estimatedRemainingSeconds = Math.ceil(remainingProgress / progressRate);
    
    return formatTimeRemaining(estimatedRemainingSeconds);
  };

  const timeRemaining = getEstimatedTimeRemaining();

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
      
      {chapters.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="chapters">
            <AccordionTrigger className="text-sm">
              {chapters.length} Chapters Found
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                {chapters.map((chapter, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="font-medium truncate flex-1 mr-4">{chapter.title}</span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(chapter.timestamp || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

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

