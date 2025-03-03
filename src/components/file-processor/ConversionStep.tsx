
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Download, List } from "lucide-react";
import ConversionStatus from '@/components/ConversionStatus';
import { ChaptersList } from '@/components/ChaptersList';
import { Chapter } from '@/utils/textExtraction';
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "@/hooks/use-toast";

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

const ConversionStep = ({
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
  const [currentProgress, setCurrentProgress] = useState(Math.max(1, progress));
  const { translations } = useLanguage();

  // Update progress when it changes externally
  useEffect(() => {
    setCurrentProgress(Math.max(1, progress));
  }, [progress]);

  // Update isConverting when conversion status changes
  useEffect(() => {
    if (conversionStatus === 'converting') {
      setIsConverting(true);
      if (currentProgress <= 0) {
        setCurrentProgress(1);
      }
    } else if (conversionStatus === 'completed' || conversionStatus === 'error') {
      setIsConverting(false);
    }
  }, [conversionStatus, currentProgress]);

  const handleConvertClick = async () => {
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
  };

  const handleProgressUpdate = (progressData: any) => {
    if (typeof progressData.progress === 'number') {
      setCurrentProgress(Math.max(1, progressData.progress));
    }
  };

  return (
    <div className="space-y-8 animate-fade-up">
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
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
          >
            <List className="w-4 h-4" />
            {translations.viewConversions || "View Conversions"}
          </Button>
        </div>

        {conversionStatus === 'idle' && (
          <Button
            onClick={handleConvertClick}
            disabled={isConverting}
            variant="default"
            className="w-full py-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
          >
            <Play className="w-5 h-5" />
            {isConverting ? translations.starting || "Starting..." : translations.startConversion || "Start Conversion"}
          </Button>
        )}

        {conversionStatus === 'completed' && audioData && (
          <Button
            onClick={onDownloadClick}
            className="w-full py-6 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:text-white dark:hover:bg-green-700"
          >
            <Download className="w-5 h-5" />
            {translations.downloadAudio || "Download Audio"}
          </Button>
        )}

        <ConversionStatus
          status={conversionStatus}
          progress={currentProgress}
          estimatedSeconds={estimatedSeconds}
          detectingChapters={detectingChapters}
          textLength={textLength}
          conversionId={conversionId}
          initialElapsedTime={elapsedTime}
          onProgressUpdate={handleProgressUpdate}
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
};

export default ConversionStep;
