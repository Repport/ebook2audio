import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ConversionControlsProps {
  status: 'idle' | 'converting' | 'completed' | 'error';
  onConvert: () => void;
  onDownload: () => void;
}

const ConversionControls = ({ status, onConvert, onDownload }: ConversionControlsProps) => {
  return (
    <div className="flex justify-center mt-6 space-x-4">
      {status === 'idle' && (
        <Button onClick={onConvert} className="bg-primary hover:bg-primary/90">
          Start Conversion
        </Button>
      )}
      
      {status === 'completed' && (
        <Button onClick={onDownload} className="bg-primary hover:bg-primary/90">
          <Download className="mr-2 h-4 w-4" />
          Download MP3
        </Button>
      )}
    </div>
  );
};

export default ConversionControls;