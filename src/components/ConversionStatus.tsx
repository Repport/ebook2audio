
import React from 'react';
import { useConversionStore, useConversionTimer } from '@/store/conversionStore';
import { useLanguage } from '@/hooks/useLanguage';
import { useConversionProgress } from '@/hooks/useConversionProgress';

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

const ConversionStatus = React.memo(({
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
  const storeConversionId = useConversionStore(state => state.conversionId);
  
  // Track previous values to prevent unnecessary renders
  const prevStoreStatusRef = React.useRef(storeStatus);
  const prevExternalStatusRef = React.useRef(externalStatus);
  
  // Use either the prop conversionId or the one from the store
  const effectiveConversionId = conversionId || storeConversionId;
  
  // Subscribe to realtime progress updates if we have a conversion ID
  const { isSubscribed } = useConversionProgress(effectiveConversionId);
  
  // Log subscription status only when it changes
  React.useEffect(() => {
    if (isSubscribed !== prevIsSubscribedRef.current && effectiveConversionId) {
      console.log(`Progress subscription status for ${effectiveConversionId}: ${isSubscribed ? 'active' : 'inactive'}`);
      prevIsSubscribedRef.current = isSubscribed;
    }
  }, [effectiveConversionId, isSubscribed]);
  const prevIsSubscribedRef = React.useRef(isSubscribed);
  
  // Start the timer at parent level to avoid multiple instances
  // Only runs when conversion is active
  useConversionTimer();
  
  // Determine which status to use - prefer store status if it's not idle
  const effectiveStatus = React.useMemo(() => {
    const newStatus = (storeStatus !== 'idle') ? storeStatus : externalStatus;
    
    // Only update refs if status changed
    if (storeStatus !== prevStoreStatusRef.current) {
      prevStoreStatusRef.current = storeStatus;
    }
    if (externalStatus !== prevExternalStatusRef.current) {
      prevExternalStatusRef.current = externalStatus;
    }
    
    return newStatus;
  }, [storeStatus, externalStatus]);

  // Status messages (without reference to file type)
  const statusMessages = React.useMemo(() => ({
    idle: translations.readyToConvert || "Ready to convert",
    converting: translations.converting?.replace('{fileType}', '') || "Converting...",
    completed: translations.conversionCompleted || "Conversion completed",
    error: translations.conversionError || "Conversion error",
    processing: translations.converting?.replace('{fileType}', '') || "Processing..."
  }), [translations]);

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
});

ConversionStatus.displayName = 'ConversionStatus';

export default ConversionStatus;
