
import React, { useMemo } from 'react';
import { useConversionStore } from '@/store/conversionStore';
import { useLanguage } from '@/hooks/useLanguage';
import { useConversionProgress } from '@/hooks/useConversionProgress';

// Importar nuestros componentes
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

const ConversionStatus = React.memo(({
  status: externalStatus,
  showPercentage = true,
  initialElapsedTime = 0,
  textLength = 0,
  conversionId = null,
  fileType = 'EPUB',
}: ConversionStatusProps) => {
  const { translations } = useLanguage();
  
  // Leer del store, no actualizarlo directamente
  const storeStatus = useConversionStore(state => state.status);
  const storeProgress = useConversionStore(state => state.progress);
  const storeWarnings = useConversionStore(state => state.warnings);
  const storeErrors = useConversionStore(state => state.errors);
  const storeConversionId = useConversionStore(state => state.conversionId);
  
  // Usar el conversionId del prop o el del store
  const effectiveConversionId = useMemo(() => 
    conversionId || storeConversionId,
  [conversionId, storeConversionId]);
  
  // Suscribirse a actualizaciones de progreso en tiempo real si tenemos un ID de conversión
  const { isSubscribed } = useConversionProgress(effectiveConversionId);
  
  // Determinar qué estado usar - preferir el estado del store si no está inactivo
  const effectiveStatus = useMemo(() => {
    return (storeStatus !== 'idle') ? storeStatus : externalStatus;
  }, [storeStatus, externalStatus]);

  // Mensajes de estado (sin referencia al tipo de archivo)
  const statusMessages = useMemo(() => ({
    idle: translations.readyToConvert || "Ready to convert",
    converting: translations.converting?.replace('{fileType}', '') || "Converting...",
    completed: translations.conversionCompleted || "Conversion completed",
    error: translations.conversionError || "Conversion error",
    processing: translations.converting?.replace('{fileType}', '') || "Processing..."
  }), [translations]);

  // Devolver el componente apropiado según el estado
  if (effectiveStatus === 'converting' || effectiveStatus === 'processing') {
    return <ConversionProgressBar 
             showPercentage={showPercentage}
             message={statusMessages[effectiveStatus]} 
           />;
  } else if (effectiveStatus === 'completed') {
    return (
      <ConversionStatusCompleted
        message={statusMessages.completed}
        warnings={storeWarnings}
        errors={storeErrors}
      />
    );
  } else if (effectiveStatus === 'error') {
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
});

ConversionStatus.displayName = 'ConversionStatus';

export default ConversionStatus;
