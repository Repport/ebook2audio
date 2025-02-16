
import React, { useState } from 'react';
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

  console.log('ConversionStep render:', { conversionStatus, isConverting }); // Debugging log

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
            progress={progress}
            estimatedSeconds={estimatedSeconds}
            detectingChapters={detectingChapters}
            textLength={textLength}
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
