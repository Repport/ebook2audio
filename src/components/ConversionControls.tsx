
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useConversionProgress } from '@/hooks/useConversionProgress';

interface ConversionControlsProps {
  status: 'idle' | 'converting' | 'completed' | 'error' | 'processing';
  onConvert: () => void;
  onDownload: () => void;
  onViewConversions: () => void;
  audioData?: ArrayBuffer | null;
  audioDuration?: number;
  estimatedSeconds?: number;
  conversionId?: string | null;
}

const ConversionControls = ({ 
  status, 
  onConvert, 
  onDownload,
  onViewConversions,
  audioData, 
  audioDuration,
  estimatedSeconds = 0,
  conversionId
}: ConversionControlsProps) => {
  const { progress, timeRemaining, elapsedTime } = useConversionProgress(
    status,
    0,
    estimatedSeconds,
    conversionId
  );

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatElapsedTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {(status === 'idle' || status === 'error') && (
        <Button 
          onClick={onConvert} 
          className="w-full max-w-xs bg-primary hover:bg-primary/90 transition-colors"
        >
          {status === 'error' ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Conversion
            </>
          ) : (
            'Start Conversion'
          )}
        </Button>
      )}
      
      {(status === 'converting' || status === 'processing') && (
        <div className="w-full max-w-xs space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatElapsedTime(elapsedTime)}</span>
            {timeRemaining && <span>{timeRemaining} remaining</span>}
          </div>
          <div className="text-sm text-muted-foreground animate-pulse text-center">
            Converting...
          </div>
        </div>
      )}
      
      {status === 'completed' && (
        <div className="w-full max-w-xs space-y-4">
          {(audioData || audioDuration) && (
            <div className="text-sm text-muted-foreground text-center">
              {audioData ? `Size: ${formatFileSize(audioData.byteLength)}` : ''}
              {audioData && audioDuration ? ' • ' : ''}
              {audioDuration ? `Duration: ${formatDuration(audioDuration)}` : ''}
            </div>
          )}
          <Button 
            onClick={onDownload} 
            className="w-full bg-primary hover:bg-primary/90 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Audio
          </Button>
          <Button
            variant="outline"
            onClick={onViewConversions}
            className="w-full"
          >
            View All Conversions
          </Button>
        </div>
      )}
    </div>
  );
};

export default ConversionControls;
