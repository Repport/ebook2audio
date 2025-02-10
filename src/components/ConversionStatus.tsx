
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
  // Keep track of the highest progress value seen
  const [smoothProgress, setSmoothProgress] = useState(progress);

  useEffect(() => {
    if (progress > smoothProgress) {
      setSmoothProgress(progress);
    }
  }, [progress]);

  // Reset progress when status changes
  useEffect(() => {
    if (status === 'idle') {
      setSmoothProgress(0);
    }
  }, [status]);

  // Map processing status to converting for display purposes
  const displayStatus = status === 'processing' ? 'converting' : status;
  
  const statusMessages = {
    idle: 'Ready to convert',
    converting: `Converting your ${fileType} to MP3...`,
    completed: 'Conversion completed!',
    error: 'Conversion failed',
    processing: `Converting your ${fileType} to MP3...`
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
    if (displayStatus !== 'converting' || smoothProgress >= 100 || !estimatedSeconds) {
      return null;
    }
    
    const remainingProgress = 100 - smoothProgress;
    const remainingTime = Math.ceil((estimatedSeconds * remainingProgress) / 100);
    return formatTimeRemaining(remainingTime);
  };

  const timeRemaining = getEstimatedTimeRemaining();

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      {(displayStatus === 'converting') && (
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      )}
      <p className="text-lg font-medium text-center">{statusMessages[status]}</p>
      
      {timeRemaining && (
        <p className="text-sm text-muted-foreground text-center">
          Estimated time remaining: {timeRemaining}
        </p>
      )}

      {detectingChapters && (
        <p className="text-sm text-muted-foreground text-center">
          Detecting chapters... Found {chaptersFound} chapters
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
                    <span className="font-medium">{chapter.title}</span>
                    <span className="text-muted-foreground">
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
          <p className="text-sm text-muted-foreground text-center">{Math.round(smoothProgress)}%</p>
        </div>
      )}
    </div>
  );
};

export default ConversionStatus;
