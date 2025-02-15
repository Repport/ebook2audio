
import React from 'react';
import ConversionStatus from '@/components/ConversionStatus';
import ConversionControls from '@/components/ConversionControls';
import { Card } from '@/components/ui/card';

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
  textLength
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
          conversionId={conversionId}
          textLength={textLength}
          showPercentage={false} // Deshabilitamos el porcentaje aquí ya que se muestra en la barra de progreso
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
