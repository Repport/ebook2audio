
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import WarningsAndErrors from './WarningsAndErrors';

interface ConversionStatusConvertingProps {
  message: string;
  progress: number;
  elapsedTime: number;
  timeRemaining: number | null;
  processedChunks: number;
  totalChunks: number;
  warnings: string[];
  errors: string[];
  showPercentage?: boolean;
}

const ConversionStatusConverting = ({
  message,
  progress,
  elapsedTime,
  timeRemaining,
  processedChunks,
  totalChunks,
  warnings,
  errors,
  showPercentage = true
}: ConversionStatusConvertingProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative inline-flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" strokeWidth={2.5} />
      </div>
      <p className="text-lg font-medium">
        {message}
      </p>
      <div className="w-full space-y-3">
        <Progress 
          value={progress} 
          className="w-full" 
          showPercentage={showPercentage} 
          status="converting" 
        />
        <div className="text-sm text-muted-foreground text-center space-y-1">
          {(elapsedTime > 0 || timeRemaining) && (
            <div className="min-h-[1.5rem]">
              {elapsedTime > 0 && (
                <span>
                  Tiempo transcurrido: {formatTimeRemaining(elapsedTime)}
                  {timeRemaining !== null && timeRemaining > 0 && (
                    <span> • Tiempo restante: {formatTimeRemaining(timeRemaining)}</span>
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
        
        <WarningsAndErrors 
          warnings={warnings}
          errors={errors}
          isConverting={true}
        />
      </div>
    </div>
  );
};

export default ConversionStatusConverting;
