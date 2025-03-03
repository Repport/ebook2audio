import React from 'react';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/spinner';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import WarningsAndErrors from './WarningsAndErrors';
import { useConversionStore, useConversionTimer } from '@/store/conversionStore';

interface ConversionProgressBarProps {
  showPercentage?: boolean;
  message?: string;
}

const ConversionProgressBar: React.FC<ConversionProgressBarProps> = ({
  showPercentage = true,
  message
}) => {
  // Usar el store global
  const {
    status,
    progress,
    chunks,
    time,
    errors,
    warnings
  } = useConversionStore(state => ({
    status: state.status,
    progress: state.progress,
    chunks: state.chunks,
    time: state.time,
    errors: state.errors,
    warnings: state.warnings
  }));
  
  // Iniciar el timer de actualización automática
  useConversionTimer();
  
  // Asegurarnos que el progreso nunca sea 0 para mantener la barra visible
  const safeProgress = Math.max(1, progress);
  
  // Estado local para determinar si tenemos suficiente información para mostrar detalles
  const hasProcessingDetails = chunks.processed > 0 || chunks.total > 0;
  const hasTimeInfo = time.elapsed > 0 || time.remaining !== null;

  // Texto descriptivo basado en la etapa de procesamiento
  const getStatusText = () => {
    if (time.elapsed < 5) {
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
  
  // Si no estamos convirtiendo, no mostrar nada
  if (status !== 'converting' && status !== 'processing') {
    return null;
  }
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative inline-flex items-center justify-center">
        <LoadingSpinner size="lg" className="text-primary" />
      </div>
      <p className="text-lg font-medium">
        {message || "Convirtiendo texto a audio..."}
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
              {time.elapsed > 0 && (
                <span>
                  Tiempo transcurrido: {formatTimeRemaining(time.elapsed)}
                  {time.remaining !== null && time.remaining > 0 && (
                    <span> • Tiempo restante: {formatTimeRemaining(time.remaining)}</span>
                  )}
                </span>
              )}
            </div>
          )}
          
          {hasProcessingDetails && (
            <div className="text-muted-foreground">
              {chunks.processed > 0 && chunks.total > 0 ? (
                <span>Procesando chunk {chunks.processed} de {chunks.total}</span>
              ) : (
                <span>Iniciando procesamiento{chunks.total > 0 ? ` de ${chunks.total} chunks` : ''}...</span>
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

export default ConversionProgressBar;
