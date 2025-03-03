
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Download, List } from "lucide-react";
import ConversionStatus from '@/components/ConversionStatus';
import { ChaptersList } from '@/components/ChaptersList';
import NavigationProtection from '@/components/NavigationProtection';
import { Chapter } from '@/utils/textExtraction';
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "@/hooks/use-toast";
import { useConversionStore } from '@/store/conversionStore';

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
  const { translations } = useLanguage();
  
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
      
      <div className="flex flex-col items-center text-center mb-6">
        <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200">
          {translations.convertToAudio || "Convert to Audio"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {translations.convertDesc || "Start the conversion process and download your audio"}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">{selectedFile.name}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onViewConversions}
            type="button"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
          >
            <List className="w-4 h-4" />
            {translations.viewConversions || "View Conversions"}
          </Button>
        </div>

        {displayStatus === 'idle' && (
          <Button
            onClick={handleConvertClick}
            disabled={isConverting}
            type="button"
            variant="default"
            className="w-full py-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
          >
            <Play className="w-5 h-5" />
            {isConverting ? translations.starting || "Starting..." : translations.startConversion || "Start Conversion"}
          </Button>
        )}

        {displayStatus === 'completed' && audioData && (
          <Button
            onClick={onDownloadClick}
            type="button"
            className="w-full py-6 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:text-white dark:hover:bg-green-700"
          >
            <Download className="w-5 h-5" />
            {translations.downloadAudio || "Download Audio"}
          </Button>
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

        {chapters.length > 0 && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              {translations.detectedChapters || "Detected Chapters"}
            </h4>
            <ChaptersList chapters={chapters} />
          </div>
        )}
      </div>
    </div>
  );
});

// Display name for debugging
ConversionStep.displayName = 'ConversionStep';

export default ConversionStep;
