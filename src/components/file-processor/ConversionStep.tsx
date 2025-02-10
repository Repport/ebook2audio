
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ConversionStatus from '@/components/ConversionStatus';
import ConversionControls from '@/components/ConversionControls';
import { Chapter } from '@/utils/textExtraction';
import { useToast } from '@/hooks/use-toast';

interface ConversionStepProps {
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  selectedFile: File;
  chapters: Chapter[];
  detectingChapters: boolean;
  detectChapters: boolean;
  estimatedSeconds: number;
  onConvert: () => void;
  onDownload: () => void;
  onViewConversions: () => void;
  onPreviousStep: () => void;
  audioData?: ArrayBuffer;
  audioDuration?: number;
  isAuthenticated: boolean;
}

const ConversionStep = ({
  conversionStatus,
  progress,
  selectedFile,
  chapters,
  detectingChapters,
  detectChapters,
  estimatedSeconds,
  onConvert,
  onDownload,
  onViewConversions,
  onPreviousStep,
  audioData,
  audioDuration,
  isAuthenticated
}: ConversionStepProps) => {
  const { toast } = useToast();
  
  // Add stuck state detection
  useEffect(() => {
    let stuckTimer: number;
    
    if (conversionStatus === 'converting' && progress === 100) {
      stuckTimer = window.setTimeout(() => {
        toast({
          title: "Conversion taking longer than expected",
          description: "Please try refreshing the page and starting over",
          variant: "destructive",
        });
      }, 30000); // Show message after 30 seconds of being stuck
    }
    
    return () => {
      if (stuckTimer) {
        clearTimeout(stuckTimer);
      }
    };
  }, [conversionStatus, progress, toast]);

  return (
    <>
      <div className="flex justify-center">
        <ConversionStatus 
          status={conversionStatus} 
          progress={progress}
          fileType={selectedFile?.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB'}
          chaptersFound={chapters.length}
          detectingChapters={detectingChapters}
          chapters={detectChapters ? chapters : []}
          estimatedSeconds={estimatedSeconds}
        />
      </div>
      
      <ConversionControls 
        status={conversionStatus}
        onConvert={onConvert}
        onDownload={onDownload}
        fileSize={audioData?.byteLength}
        duration={audioDuration}
      />

      {isAuthenticated && conversionStatus === 'completed' && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={onViewConversions}
          >
            View All Conversions
          </Button>
        </div>
      )}

      <div className="flex justify-start mt-8">
        <Button
          variant="outline"
          onClick={onPreviousStep}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Button>
      </div>
    </>
  );
};

export default ConversionStep;
