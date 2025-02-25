
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Download, List } from "lucide-react";
import ConversionStatus from '@/components/ConversionStatus';
import { ChaptersList } from '@/components/ChaptersList';
import { Chapter } from '@/utils/textExtraction';

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
  textLength
}: ConversionStepProps) => {
  const [isConverting, setIsConverting] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(progress);

  // Actualizar el progreso cuando cambie externamente
  useEffect(() => {
    console.log(`ConversionStep - progress prop changed: ${progress}%`);
    setCurrentProgress(progress);
  }, [progress]);

  // Actualizar isConverting cuando cambie el estado de conversión
  useEffect(() => {
    console.log(`ConversionStep - status changed: ${conversionStatus}`);
    if (conversionStatus === 'converting') {
      setIsConverting(true);
    } else if (conversionStatus === 'completed' || conversionStatus === 'error') {
      setIsConverting(false);
    }
  }, [conversionStatus]);

  const handleConvertClick = async () => {
    setIsConverting(true);
    try {
      const canProceed = await onConvert();
      if (!canProceed) {
        setIsConverting(false);
      }
    } catch (error) {
      setIsConverting(false);
      console.error('Error during conversion:', error);
    }
  };

  // Log para depuración
  useEffect(() => {
    console.log('ConversionStep render:', { 
      conversionStatus, 
      isConverting, 
      progress: currentProgress,
      hasAudioData: !!audioData 
    });
  }, [conversionStatus, isConverting, currentProgress, audioData]);

  const handleProgressUpdate = (progressData: any) => {
    console.log('Progress update in ConversionStep:', progressData);
    if (typeof progressData.progress === 'number') {
      setCurrentProgress(progressData.progress);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Convert to Audio</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewConversions}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              View Conversions
            </Button>
          </div>

          {conversionStatus === 'idle' && (
            <Button
              onClick={handleConvertClick}
              className="flex items-center gap-2"
              disabled={isConverting}
            >
              <Play className="w-4 h-4" />
              {isConverting ? "Starting..." : "Start Conversion"}
            </Button>
          )}

          {conversionStatus === 'completed' && audioData && (
            <Button
              onClick={onDownloadClick}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Audio
            </Button>
          )}

          <ConversionStatus
            status={conversionStatus}
            progress={currentProgress}
            estimatedSeconds={estimatedSeconds}
            detectingChapters={detectingChapters}
            textLength={textLength}
            conversionId={conversionId}
            onProgressUpdate={handleProgressUpdate}
          />

          {chapters.length > 0 && (
            <ChaptersList chapters={chapters} />
          )}
        </div>
      </div>
    </Card>
  );
};

export default ConversionStep;
