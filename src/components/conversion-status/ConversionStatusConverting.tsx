
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import WarningsAndErrors from './WarningsAndErrors';
import { Spinner } from '@/components/ui/spinner';

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
  // Aseguramos que el progreso nunca sea 0 para mantener la barra visible
  const safeProgress = Math.max(1, progress);
  
  // Estado local para determinar si tenemos suficiente información para mostrar detalles
  const hasProcessingDetails = processedChunks > 0 || totalChunks > 0;
  const hasTimeInfo = elapsedTime > 0 || timeRemaining !== null;

  // Texto descriptivo basado en la etapa de procesamiento
  const getStatusText = () => {
    if (elapsedTime < 5) {
      return "Iniciando conversión...";
    } else if (progress < 15) {
      return "Preparando archivos de audio...";
    } else if (progress < 50) {
      return "Procesando texto...";
    } else if (progress < 85) {
      return "Generando audio...";
    } else {
      return "Finalizando...";
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative inline-flex items-center justify-center">
        <Spinner size="lg" className="text-primary" />
      </div>
      <p className="text-lg font-medium">
        {message}
      </p>
      <div className="w-full space-y-3">
        <Progress 
          value={safeProgress} 
          className="w-full h-5" 
          showPercentage={showPercentage} 
          status="converting" 
        />
        
        <div className="text-sm text-center space-y-2">
          <div className="font-medium text-primary">
            {getStatusText()}
          </div>
          
          {hasTimeInfo && (
            <div className="min-h-[1.5rem] text-muted-foreground">
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
          
          {hasProcessingDetails && (
            <div className="text-muted-foreground">
              {processedChunks > 0 && totalChunks > 0 ? (
                <span>Procesando chunk {processedChunks} de {totalChunks}</span>
              ) : (
                <span>Iniciando procesamiento{totalChunks > 0 ? ` de ${totalChunks} chunks` : ''}...</span>
              )}
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
