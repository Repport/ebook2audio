
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ConversionStatus from '@/components/ConversionStatus';
import NavigationProtection from '@/components/NavigationProtection';
import { Chapter } from '@/utils/textExtraction';
import { toast } from "@/hooks/use-toast";
import { useConversionStore } from '@/store/conversionStore';

// Import our new components
import ConversionHeader from './conversion-step/ConversionHeader';
import ConversionButton from './conversion-step/ConversionButton';
import DownloadButton from './conversion-step/DownloadButton';
import ChaptersDisplay from './conversion-step/ChaptersDisplay';
import ConversionStepTitle from './conversion-step/ConversionStepTitle';

interface ConversionStepProps {
  selectedFile: File;
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  audioData: ArrayBuffer | null;
  audioDuration: number;
  estimatedSeconds: number;
  onConvert: () => Promise<boolean>;
  onDownloadClick: () => void;
  onViewConversions: () => void;
  conversionId?: string | null;
  chapters: Chapter[];
  detectingChapters: boolean;
  textLength: number;
  elapsedTime?: number;
}

// Wrap in React.memo to prevent unnecessary re-renders
const ConversionStep = React.memo(({
  selectedFile,
  conversionStatus,
  progress,
  audioData,
  audioDuration,
  estimatedSeconds,
  onConvert,
  onDownloadClick,
  onViewConversions,
  conversionId,
  chapters,
  detectingChapters,
  textLength,
  elapsedTime = 0
}: ConversionStepProps) => {
  const [isConverting, setIsConverting] = useState(false);
  
  // Get store values only once using selector functions
  const storeProgress = useConversionStore(state => state.progress);
  const storeStatus = useConversionStore(state => state.status);
  
  // Use refs to track previous values
  const prevStatus = React.useRef(conversionStatus);
  const prevStoreStatus = React.useRef(storeStatus);

  // Create a memoized value for active conversion status
  const isConversionActive = useMemo(() => 
    conversionStatus === 'converting' || storeStatus === 'converting',
  [conversionStatus, storeStatus]);
  
  // Use memoized values for display data
  const displayProgress = useMemo(() => 
    storeProgress || progress,
  [storeProgress, progress]);
  
  const displayStatus = useMemo(() => 
    storeStatus === 'idle' ? conversionStatus : storeStatus,
  [storeStatus, conversionStatus]);

  // Only update isConverting when status actually changes
  useEffect(() => {
    const localConversionStatus = conversionStatus;
    const localStoreStatus = storeStatus;
    
    // Only update if there's an actual change to avoid render loops
    if (localConversionStatus !== prevStatus.current || 
        localStoreStatus !== prevStoreStatus.current) {
      
      if (localConversionStatus === 'converting' || localStoreStatus === 'converting') {
        setIsConverting(true);
      } else if (
        (localConversionStatus === 'completed' || localConversionStatus === 'error') || 
        (localStoreStatus === 'completed' || localStoreStatus === 'error')
      ) {
        setIsConverting(false);
      }
      
      // Update refs with new values
      prevStatus.current = localConversionStatus;
      prevStoreStatus.current = localStoreStatus;
    }
  }, [conversionStatus, storeStatus]);

  const handleConvertClick = useCallback(async (e: React.MouseEvent) => {
    // Prevenir comportamiento por defecto para evitar envíos de formulario potenciales
    e.preventDefault();
    e.stopPropagation();
    
    console.log("ConversionStep - handleConvertClick called");
    if (isConverting) {
      console.log("ConversionStep - Already converting, ignoring click");
      return;
    }
    
    setIsConverting(true);
    try {
      console.log("ConversionStep - Calling onConvert");
      const canProceed = await onConvert();
      console.log("ConversionStep - onConvert result:", canProceed);
      
      if (!canProceed) {
        setIsConverting(false);
        console.log("ConversionStep - Could not proceed with conversion");
        toast({
          title: "Error",
          description: "Could not start conversion process",
          variant: "destructive"
        });
      }
    } catch (error) {
      setIsConverting(false);
      console.error('ConversionStep - Error during conversion:', error);
      toast({
        title: "Error",
        description: "An error occurred during conversion",
        variant: "destructive"
      });
    }
  }, [isConverting, onConvert]);
  
  return (
    <div className="space-y-8 animate-fade-up">
      {/* Add NavigationProtection when conversion is in progress */}
      {isConversionActive && <NavigationProtection isActive={true} />}
      
      <ConversionStepTitle />

      <div className="space-y-6">
        <ConversionHeader 
          fileName={selectedFile.name}
          onViewConversions={onViewConversions}
        />

        {displayStatus === 'idle' && (
          <ConversionButton
            isConverting={isConverting}
            onConvert={handleConvertClick}
          />
        )}

        {displayStatus === 'completed' && audioData && (
          <DownloadButton onDownloadClick={onDownloadClick} />
        )}

        <ConversionStatus
          status={displayStatus}
          progress={displayProgress}
          estimatedSeconds={estimatedSeconds}
          detectingChapters={detectingChapters}
          textLength={textLength}
          conversionId={conversionId}
          initialElapsedTime={elapsedTime}
        />

        <ChaptersDisplay chapters={chapters} />
      </div>
    </div>
  );
});

// Display name for debugging
ConversionStep.displayName = 'ConversionStep';

export default ConversionStep;
