
import React, { useEffect } from 'react';
import { useConversionStore } from '@/store/conversionStore';
import { useLanguage } from '@/hooks/useLanguage';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

// Import our components
import ConversionStatusIdle from './conversion-status/ConversionStatusIdle';
import ConversionStatusError from './conversion-status/ConversionStatusError';
import ConversionStatusCompleted from './conversion-status/ConversionStatusCompleted';
import ConversionProgressBar from './conversion-status/ConversionProgressBar';

interface ConversionStatusProps {
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing';
  progress?: number;
  fileType?: 'PDF' | 'EPUB';
  chaptersFound?: number;
  detectingChapters?: boolean;
  chapters?: any[];
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
  estimatedSeconds = 0,
  conversionId,
  textLength = 0,
  showPercentage = true,
  initialElapsedTime = 0,
  onProgressUpdate
}: ConversionStatusProps) => {
  const { translations } = useLanguage();
  
  // Obtener estado del store global
  const { 
    updateProgress, 
    resetConversion 
  } = useConversionStore();
  
  // Para mejor depuración
  useEffect(() => {
    console.log(`ConversionStatus - Status changed to ${status}, progress: ${progress}%`);
    
    // Inicializar el estado global basado en los props iniciales
    if (status === 'converting' || status === 'processing') {
      // Actualizar el store con datos iniciales
      updateProgress({
        progress,
        processedChunks: 0,
        totalChunks: 0,
        processedCharacters: 0,
        totalCharacters: textLength
      });
    } else if (status === 'completed') {
      updateProgress({
        progress: 100,
        isCompleted: true
      });
    } else if (status === 'error') {
      useConversionStore.getState().setError("Error en la conversión");
    } else if (status === 'idle') {
      resetConversion();
    }
  }, [status, progress, textLength, updateProgress, resetConversion]);
  
  // Reenviar actualizaciones de progreso al componente padre
  useEffect(() => {
    if (onProgressUpdate) {
      const unsubscribe = useConversionStore.subscribe(
        state => ({
          progress: state.progress,
          processedChunks: state.chunks.processed,
          totalChunks: state.chunks.total,
          elapsedTime: state.time.elapsed
        }),
        (data) => {
          onProgressUpdate(data);
        }
      );
      
      return () => unsubscribe();
    }
  }, [onProgressUpdate]);

  // Status messages (without reference to file type)
  const statusMessages = {
    idle: translations.readyToConvert || "Ready to convert",
    converting: translations.converting?.replace('{fileType}', '') || "Converting...",
    completed: translations.conversionCompleted || "Conversion completed",
    error: translations.conversionError || "Conversion error",
    processing: translations.converting?.replace('{fileType}', '') || "Processing..."
  };

  // Return the appropriate component based on status
  if (status === 'converting' || status === 'processing') {
    return <ConversionProgressBar 
             showPercentage={showPercentage}
             message={statusMessages[status]} 
           />;
  } else if (status === 'completed') {
    const { warnings, errors } = useConversionStore.getState();
    return (
      <ConversionStatusCompleted
        message={statusMessages.completed}
        warnings={warnings}
        errors={errors}
      />
    );
  } else if (status === 'error') {
    return (
      <ConversionStatusError
        message={statusMessages.error}
      />
    );
  } else {
    return (
      <ConversionStatusIdle
        message={statusMessages.idle}
      />
    );
  }
};

export default ConversionStatus;
