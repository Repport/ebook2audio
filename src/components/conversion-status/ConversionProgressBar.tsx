
import React, { useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/spinner';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import WarningsAndErrors from './WarningsAndErrors';
import { useConversionStore } from '@/store/conversionStore';

interface ConversionProgressBarProps {
  showPercentage?: boolean;
  message?: string;
}

const ConversionProgressBar: React.FC<ConversionProgressBarProps> = ({
  showPercentage = true,
  message
}) => {
  // Usar el store global with specific selectors to prevent unnecessary re-renders
  const status = useConversionStore(state => state.status);
  const progress = useConversionStore(state => state.progress);
  const processedChunks = useConversionStore(state => state.chunks.processed);
  const totalChunks = useConversionStore(state => state.chunks.total);
  const processedCharacters = useConversionStore(state => state.chunks.processedCharacters);
  const totalCharacters = useConversionStore(state => state.chunks.totalCharacters);
  const timeElapsed = useConversionStore(state => state.time.elapsed);
  const timeRemaining = useConversionStore(state => state.time.remaining);
  const errors = useConversionStore(state => state.errors);
  const warnings = useConversionStore(state => state.warnings);
  
  // Last value ref to track significant changes
  const lastProgressRef = React.useRef(progress);
  
  // Log progress for debugging
  useEffect(() => {
    // Only log when progress changes significantly to avoid too much noise
    if (Math.abs(progress - lastProgressRef.current) >= 5) {
      console.log(`ConversionProgressBar - Progress update: ${lastProgressRef.current}% -> ${progress}%, Status: ${status}`);
      console.log(`Chunks: ${processedChunks}/${totalChunks}, Chars: ${processedCharacters}/${totalCharacters}`);
      lastProgressRef.current = progress;
    }
  }, [progress, status, processedChunks, totalChunks, processedCharacters, totalCharacters]);
  
  // Asegurarnos que el progreso nunca sea 0 para mantener la barra visible
  const safeProgress = Math.max(1, progress);
  
  // Estado local para determinar si tenemos suficiente información para mostrar detalles
  const hasProcessingDetails = processedChunks > 0 || totalChunks > 0;
  const hasTimeInfo = timeElapsed > 0 || timeRemaining !== null;
  const hasCharInfo = processedCharacters > 0 && totalCharacters > 0;

  // Texto descriptivo basado en la etapa de procesamiento
  const getStatusText = () => {
    if (timeElapsed < 5) {
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
  
  // Debug mode for detailed state information
  const isDebugMode = import.meta.env.DEV;
  
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
              {timeElapsed > 0 && (
                <span>
                  Tiempo transcurrido: {formatTimeRemaining(timeElapsed)}
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
              
              {hasCharInfo && (
                <span className="ml-2">
                  ({Math.round((processedCharacters / totalCharacters) * 100)}% del texto)
                </span>
              )}
            </div>
          )}
          
          {isDebugMode && (
            <div className="bg-gray-100 dark:bg-gray-800 p-2 mt-2 text-xs rounded text-left">
              <div><strong>Debug Info:</strong></div>
              <div>Status: {status}</div>
              <div>Progress: {progress}%</div>
              <div>Chunks: {processedChunks}/{totalChunks}</div>
              <div>Chars: {processedCharacters}/{totalCharacters}</div>
              <div>Time: {timeElapsed}s elapsed, {timeRemaining}s remaining</div>
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
