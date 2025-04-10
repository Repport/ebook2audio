
import React from 'react';
import TermsDialog from '../TermsDialog';
import { ConversionOptions } from '@/hooks/file-processor/useConversionActions';

interface FileProcessorTermsProps {
  showTerms: boolean;
  setShowTerms: (show: boolean) => void;
  handleTermsAccept: (options: ConversionOptions) => Promise<void>;
  fileName?: string;
}

const FileProcessorTerms: React.FC<FileProcessorTermsProps> = ({
  showTerms,
  setShowTerms,
  handleTermsAccept,
  fileName
}) => {
  // Create default options for terms acceptance
  const defaultOptions: ConversionOptions = {
    selectedVoice: '',
    notifyOnComplete: false
  };

  return (
    <TermsDialog
      open={showTerms}
      onClose={() => setShowTerms(false)}
      onAccept={() => handleTermsAccept(defaultOptions)}
      fileName={fileName}
    />
  );
};

export default FileProcessorTerms;
