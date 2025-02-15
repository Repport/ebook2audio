
import React from 'react';
import ConversionStatus from '@/components/ConversionStatus';
import ConversionControls from '@/components/ConversionControls';
import { Card } from '@/components/ui/card';
import { Chapter } from '@/utils/textExtraction';

interface ConversionStepProps {
  selectedFile: File;
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error' | 'processing';
  progress: number;
  audioData: ArrayBuffer | null;
  audioDuration: number;
  estimatedSeconds: number;
  onConvert: () => void;
  onDownloadClick: () => void;
  onViewConversions: () => void;
  conversionId: string | null;
  textLength?: number;
  chapters: Chapter[];
  detectingChapters?: boolean;
}

const ConversionStep = ({
  conversionStatus,
  progress,
  selectedFile,
  estimatedSeconds,
  onConvert,
  onDownloadClick,
  onViewConversions,
  audioData,
  audioDuration,
  conversionId,
  textLength,
  chapters,
  detectingChapters = false
}: ConversionStepProps) => {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-center">
        <ConversionStatus 
          status={conversionStatus}
          progress={progress}
          fileType={selectedFile?.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB'}
          chaptersFound={chapters.length}
          detectingChapters={detectingChapters}
          chapters={chapters}
          estimatedSeconds={estimatedSeconds}
          conversionId={conversionId}
          textLength={textLength}
          showPercentage={true}
        />
      </div>
      
      <ConversionControls 
        status={conversionStatus}
        onConvert={onConvert}
        onDownload={onDownloadClick}
        onViewConversions={onViewConversions}
        audioData={audioData}
        audioDuration={audioDuration}
        estimatedSeconds={estimatedSeconds}
        conversionId={conversionId}
        progress={progress}
      />
    </Card>
  );
};

export default ConversionStep;
