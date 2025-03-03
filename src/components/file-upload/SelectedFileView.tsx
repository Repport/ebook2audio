
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import FileInfo from '@/components/FileInfo';
import { Chapter } from '@/utils/textExtraction';

interface SelectedFileViewProps {
  file: File;
  isProcessing: boolean;
  metadata: {
    totalCharacters?: number;
    processedPages?: number;
  };
  onRemove: () => void;
  onContinue: () => void;
}

const SelectedFileView: React.FC<SelectedFileViewProps> = ({
  file,
  isProcessing,
  metadata,
  onRemove,
  onContinue
}) => {
  return (
    <div className="space-y-4">
      <FileInfo 
        file={file} 
        onRemove={onRemove}
        metadata={metadata}
      />
      <div className="flex justify-end mt-4">
        <Button 
          onClick={onContinue}
          className="flex items-center gap-2"
          disabled={isProcessing}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default SelectedFileView;
