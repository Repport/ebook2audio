
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ConversionControlsProps {
  status: 'idle' | 'converting' | 'completed' | 'error';
  onConvert: () => void;
  onDownload: () => void;
  fileSize?: number;
  duration?: number;
}

const ConversionControls = ({ status, onConvert, onDownload, fileSize, duration }: ConversionControlsProps) => {
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

  return (
    <div className="flex flex-col items-center mt-6 space-y-4">
      {(status === 'idle' || status === 'error') && (
        <Button onClick={onConvert} className="bg-primary hover:bg-primary/90">
          {status === 'error' ? 'Retry Conversion' : 'Start Conversion'}
        </Button>
      )}
      
      {status === 'converting' && (
        <div className="text-sm text-muted-foreground">
          Converting...
        </div>
      )}
      
      {status === 'completed' && (
        <>
          {fileSize && duration && (
            <div className="text-sm text-muted-foreground">
              File size: {formatFileSize(fileSize)} • Duration: {formatDuration(duration)}
            </div>
          )}
          <Button onClick={onDownload} className="bg-primary hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            Download MP3
          </Button>
        </>
      )}
    </div>
  );
};

export default ConversionControls;

