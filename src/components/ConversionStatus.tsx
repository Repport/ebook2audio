
import React, { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Chapter } from '@/utils/textExtraction';
import { ChaptersList } from './ChaptersList';
import { useConversionProgress } from '@/hooks/useConversionProgress';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/hooks/useLanguage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  const [showWarnings, setShowWarnings] = useState(false);
  
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
      totalChunks,
      errors,
      warnings
    });
  }, [progress, currentProgress, timeRemaining, elapsedTime, processedChunks, totalChunks, status, errors, warnings]);

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

  const renderWarningsAndErrors = () => {
    if ((warnings.length === 0 && errors.length === 0) || status !== 'converting') {
      return null;
    }

    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="integrity-warnings">
          <AccordionTrigger className="flex items-center text-amber-500">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span>
              {warnings.length > 0 ? `${warnings.length} advertencias` : `${errors.length} errores`}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
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
          status="idle"
        />
        <div className="text-sm text-muted-foreground text-center space-y-1">
          <div>
            {elapsedTime > 0 && (
              <span>
                {translations.timeElapsed.replace('{time}', formatTime(elapsedTime))}
                {typeof timeRemaining === 'number' && timeRemaining > 0 && (
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
              Procesando chunk {processedChunks} de {totalChunks}
            </div>
          )}
        </div>
        
        {renderWarningsAndErrors()}
      </div>
    </div>
  );

  const renderCompletedStatus = () => (
    <div className="w-full flex flex-col items-center justify-center gap-3">
      <CheckCircle2 className="w-12 h-12 text-green-500" />
      <p className="text-lg font-medium text-green-600 text-center">
        {statusMessages[status]}
      </p>
      
      {(warnings.length > 0 || errors.length > 0) && (
        <Alert variant={errors.length > 0 ? "destructive" : "warning"} className="mt-4">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription className="ml-2">
            La conversión se completó con {warnings.length} advertencias y {errors.length} errores.
            <button 
              className="block underline mt-1 text-sm"
              onClick={() => setShowWarnings(!showWarnings)}
            >
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
