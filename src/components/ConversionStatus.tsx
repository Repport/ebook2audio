
import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Chapter } from '@/utils/textExtraction';
import { ChaptersList } from './ChaptersList';
import { useConversionProgress } from '@/hooks/useConversionProgress';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/hooks/useLanguage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatTimeRemaining } from '@/utils/timeFormatting';

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
  const {
    translations
  } = useLanguage();
  const [showWarnings, setShowWarnings] = useState(false);

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
  } = useConversionProgress(status, progress, estimatedSeconds, conversionId, textLength, initialElapsedTime);

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

  // Render warnings and errors
  const renderWarningsAndErrors = () => {
    if ((warnings.length === 0 && errors.length === 0) || displayStatus !== 'converting') {
      return null;
    }
    return <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="integrity-warnings">
          <AccordionTrigger className="flex items-center text-amber-500">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span>
              {warnings.length > 0 ? `${warnings.length} advertencias` : `${errors.length} errores`}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm">
              {warnings.map((warning, index) => <div key={`warning-${index}`} className="flex items-start p-2 bg-amber-50 dark:bg-amber-950 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </div>)}
              
              {errors.map((error, index) => <div key={`error-${index}`} className="flex items-start p-2 bg-red-50 dark:bg-red-950 rounded-md">
                  <X className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>)}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>;
  };

  // Render conversion in progress state
  const renderConvertingStatus = () => (
    <div className="flex flex-col items-center gap-4">
      <div className="relative inline-flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" strokeWidth={2.5} />
      </div>
      <p className="text-lg font-medium">
        {statusMessages[displayStatus]}
      </p>
      <div className="w-full space-y-3">
        <Progress value={currentProgress} className="w-full" showPercentage={showPercentage} status="idle" />
        <div className="text-sm text-muted-foreground text-center space-y-1">
          {(elapsedTime > 0 || timeRemaining) && (
            <div className="min-h-[1.5rem]">
              {elapsedTime > 0 && (
                <span>
                  {translations.timeElapsed.replace('{time}', formatTimeRemaining(elapsedTime))}
                  {timeRemaining !== null && timeRemaining > 0 && (
                    <span> • {translations.timeRemaining.replace('{time}', formatTimeRemaining(timeRemaining))}</span>
                  )}
                </span>
              )}
            </div>
          )}
          
          {processedChunks > 0 && totalChunks > 0 && (
            <div>
              Procesando chunk {processedChunks} de {totalChunks}
            </div>
          )}
        </div>
        
        {renderWarningsAndErrors()}
      </div>
    </div>
  );

  // Render completed state
  const renderCompletedStatus = () => (
    <div className="w-full flex flex-col items-center justify-center gap-3">
      <CheckCircle2 className="w-12 h-12 text-green-500" />
      <p className="text-lg font-medium text-green-600 text-center">
        {statusMessages[displayStatus]}
      </p>
      
      {(warnings.length > 0 || errors.length > 0) && (
        <Alert variant={errors.length > 0 ? "destructive" : "warning"} className="mt-4">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription className="ml-2">
            La conversión se completó con {warnings.length} advertencias y {errors.length} errores.
            <button className="block underline mt-1 text-sm" onClick={() => setShowWarnings(!showWarnings)}>
              {showWarnings ? 'Ocultar detalles' : 'Mostrar detalles'}
            </button>
          </AlertDescription>
          
          {showWarnings && (
            <div className="mt-2 space-y-2 text-sm">
              {warnings.map((warning, index) => (
                <div key={`warning-${index}`} className="flex items-start p-2 bg-amber-50 dark:bg-amber-950 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </div>
              ))}
              
              {errors.map((error, index) => (
                <div key={`error-${index}`} className="flex items-start p-2 bg-red-50 dark:bg-red-950 rounded-md">
                  <X className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}
        </Alert>
      )}
    </div>
  );

  // Render error state
  const renderErrorStatus = () => (
    <Alert variant="destructive">
      <AlertCircle className="h-5 w-5" />
      <AlertDescription className="ml-2">
        {statusMessages[displayStatus]}
      </AlertDescription>
    </Alert>
  );

  // Render idle state
  const renderIdleStatus = () => (
    <p className="text-base font-medium text-center text-gray-600 dark:text-gray-300">
      {statusMessages[displayStatus]}
    </p>
  );

  // Return the appropriate component based on status
  if (displayStatus === 'converting' || displayStatus === 'processing') {
    return renderConvertingStatus();
  } else if (displayStatus === 'completed') {
    return renderCompletedStatus();
  } else if (displayStatus === 'error') {
    return renderErrorStatus();
  } else {
    return renderIdleStatus();
  }
};

export default ConversionStatus;
