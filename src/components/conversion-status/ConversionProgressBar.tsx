import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/spinner';
import { formatTimeRemaining } from '@/utils/timeFormatting';
import WarningsAndErrors from './WarningsAndErrors';
import { useConversionStore } from '@/store/conversionStore';
import { LoggingService } from '@/utils/loggingService';
import { useConversionProgress } from '@/hooks/useConversionProgress';

interface ConversionProgressBarProps {
  showPercentage?: boolean;
  message?: string;
}

const ConversionProgressBar: React.FC<ConversionProgressBarProps> = ({
  showPercentage = true,
  message
}) => {
  // Use the store global with specific selectors to prevent unnecessary re-renders
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
  const conversionId = useConversionStore(state => state.conversionId);
  
  // Subscribe to realtime progress updates if we have a conversion ID
  const { isSubscribed } = useConversionProgress(conversionId);
  
  // Local state for debug logs
  const [debugLogs, setDebugLogs] = useState<Array<{
    timestamp: string;
    progress: number;
    chunks: string;
    chars: string;
  }>>([]);
  
  // Last value ref to track significant changes
  const lastProgressRef = React.useRef(progress);
  const lastChunksRef = React.useRef(processedChunks);
  const lastCharsRef = React.useRef(processedCharacters);
  
  // Flag for showing debug info
  const [showDebug, setShowDebug] = useState(false);
  
  // Load progress logs from localStorage for debugging
  useEffect(() => {
    try {
      const storedLogs = localStorage.getItem('conversionProgressLogs');
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs);
        setDebugLogs(parsedLogs.map((log: any) => ({
          timestamp: new Date(log.timestamp).toLocaleTimeString(),
          progress: log.progress,
          chunks: `${log.processedChunks}/${log.totalChunks}`,
          chars: `${log.processedCharacters}/${log.totalCharacters}`
        })));
      }
    } catch (e) {
      // Ignore errors
    }
    
    // Enable debug mode with triple click
    const handleTripleClick = () => {
      setShowDebug(prev => !prev);
    };
    
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        handleTripleClick();
      }
    });
    
    return () => {
      document.removeEventListener('keydown', handleTripleClick);
    };
  }, []);
  
  // Log progress for debugging
  useEffect(() => {
    // Only log when progress changes significantly or chunks/chars change
    const progressChanged = Math.abs(progress - lastProgressRef.current) >= 5;
    const chunksChanged = processedChunks !== lastChunksRef.current;
    const charsChanged = Math.abs(processedCharacters - lastCharsRef.current) >= 1000;
    
    if (progressChanged || chunksChanged || charsChanged) {
      console.log(`ConversionProgressBar - Progress update: ${lastProgressRef.current}% -> ${progress}%, Status: ${status}`);
      console.log(`Chunks: ${processedChunks}/${totalChunks}, Chars: ${processedCharacters}/${totalCharacters}`);
      console.log(`Realtime subscription active: ${isSubscribed}`);
      
      // Update references
      lastProgressRef.current = progress;
      lastChunksRef.current = processedChunks;
      lastCharsRef.current = processedCharacters;
      
      // Log for system monitoring
      if (progressChanged) {
        LoggingService.debug('conversion', {
          message: 'Actualización significativa de progreso en UI',
          progress,
          chunks: `${processedChunks}/${totalChunks}`,
          chars: `${processedCharacters}/${totalCharacters}`,
          subscription_active: isSubscribed
        });
      }
      
      // Add to debug log
      setDebugLogs(prev => {
        const newLog = {
          timestamp: new Date().toLocaleTimeString(),
          progress,
          chunks: `${processedChunks}/${totalChunks}`,
          chars: `${processedCharacters}/${totalCharacters}`
        };
        const updatedLogs = [...prev, newLog];
        if (updatedLogs.length > 20) {
          return updatedLogs.slice(-20);
        }
        return updatedLogs;
      });
    }
  }, [progress, status, processedChunks, totalChunks, processedCharacters, totalCharacters, isSubscribed]);
  
  // Make sure progress is never 0 to keep the bar visible
  const safeProgress = Math.max(1, progress);
  
  // Local state to determine if we have enough information to show details
  const hasProcessingDetails = processedChunks > 0 || totalChunks > 0;
  const hasTimeInfo = timeElapsed > 0 || timeRemaining !== null;
  const hasCharInfo = processedCharacters > 0 && totalCharacters > 0;

  // Descriptive text based on processing stage
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
  const isDebugMode = import.meta.env.DEV || showDebug;
  
  // If not converting, show nothing
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
        {isSubscribed && <span className="text-xs text-green-500 ml-2">(Realtime)</span>}
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
          
          {/* Button to toggle debug mode in production */}
          {!import.meta.env.DEV && (
            <div className="pt-2">
              <button 
                onClick={() => setShowDebug(prev => !prev)}
                className="text-xs text-muted-foreground hover:text-muted-foreground/80 transition-colors"
              >
                {showDebug ? '⬆️ Ocultar debug' : '⬇️ Mostrar debug'}
              </button>
            </div>
          )}
          
          {isDebugMode && (
            <div className="bg-gray-100 dark:bg-gray-800 p-2 mt-2 text-xs rounded text-left">
              <div><strong>Estado de Conversión:</strong></div>
              <div>Status: {status}</div>
              <div>Progress: {progress}%</div>
              <div>Chunks: {processedChunks}/{totalChunks} ({totalChunks > 0 ? Math.round((processedChunks / totalChunks) * 100) : 0}%)</div>
              <div>Chars: {processedCharacters}/{totalCharacters} ({totalCharacters > 0 ? Math.round((processedCharacters / totalCharacters) * 100) : 0}%)</div>
              <div>Time: {timeElapsed}s elapsed, {timeRemaining}s remaining</div>
              <div>Conversion ID: {conversionId || 'no id'}</div>
              <div>Realtime subscription: {isSubscribed ? 'Active' : 'Inactive'}</div>
              
              {debugLogs.length > 0 && (
                <div className="mt-2">
                  <div><strong>Historial de Progreso:</strong></div>
                  <div className="max-h-32 overflow-y-auto text-[10px] mt-1">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="px-1 text-left">Hora</th>
                          <th className="px-1 text-left">Progreso</th>
                          <th className="px-1 text-left">Chunks</th>
                          <th className="px-1 text-left">Caracteres</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugLogs.map((log, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-gray-200 dark:bg-gray-700' : ''}>
                            <td className="px-1">{log.timestamp}</td>
                            <td className="px-1">{log.progress}%</td>
                            <td className="px-1">{log.chunks}</td>
                            <td className="px-1">{log.chars}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
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
