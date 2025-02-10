
import React from 'react';
import { Button } from '@/components/ui/button';
import ConversionStatus from '@/components/ConversionStatus';
import ConversionControls from '@/components/ConversionControls';
import { Card } from '@/components/ui/card';

interface ConversionStepProps {
  selectedFile: File;
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  audioData?: ArrayBuffer;
  audioDuration?: number;
  estimatedSeconds: number;
  onConvert: () => void;
  onDownloadClick: () => void;
  onViewConversions: () => void;
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
  audioDuration
}: ConversionStepProps) => {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-center">
        <ConversionStatus 
          status={conversionStatus}
          progress={progress}
          fileType={selectedFile?.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB'}
          chaptersFound={0}
          detectingChapters={false}
          chapters={[]}
          estimatedSeconds={estimatedSeconds}
        />
      </div>
      
      <ConversionControls 
        status={conversionStatus}
        onConvert={onConvert}
        onDownload={onDownloadClick}
        fileSize={audioData?.byteLength}
        duration={audioDuration}
      />

      {conversionStatus === 'completed' && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onViewConversions}
            className="w-full max-w-xs"
          >
            Ver Todas las Conversiones
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ConversionStep;
