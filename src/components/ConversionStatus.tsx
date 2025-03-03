
import React from 'react';
import { useConversionStore } from '@/store/conversionStore';
import { useLanguage } from '@/hooks/useLanguage';

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
  status: externalStatus,
  showPercentage = true,
  initialElapsedTime = 0,
  textLength = 0,
  conversionId = null,
  fileType = 'EPUB',
}: ConversionStatusProps) => {
  const { translations } = useLanguage();
  
  // Read from store, don't update it directly
  const storeStatus = useConversionStore(state => state.status);
  const storeProgress = useConversionStore(state => state.progress);
  const storeWarnings = useConversionStore(state => state.warnings);
  const storeErrors = useConversionStore(state => state.errors);
  
  // Determine which status to use - prefer store status if it's not idle
  const effectiveStatus = (storeStatus !== 'idle') ? storeStatus : externalStatus;

  // Status messages (without reference to file type)
  const statusMessages = {
    idle: translations.readyToConvert || "Ready to convert",
    converting: translations.converting?.replace('{fileType}', '') || "Converting...",
    completed: translations.conversionCompleted || "Conversion completed",
    error: translations.conversionError || "Conversion error",
    processing: translations.converting?.replace('{fileType}', '') || "Processing..."
  };

  // Return the appropriate component based on status
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
};

export default ConversionStatus;
