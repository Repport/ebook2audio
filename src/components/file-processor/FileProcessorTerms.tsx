
import React from 'react';
import TermsDialog from '../TermsDialog';
import { ConversionOptions } from '@/hooks/file-processor/useConversionActions';

interface FileProcessorTermsProps {
  showTerms: boolean;
  setShowTerms: (show: boolean) => void;
  handleTermsAccept: (options: ConversionOptions) => Promise<void>;
  termsAcceptOptions: ConversionOptions;
  fileName?: string;
}

const FileProcessorTerms: React.FC<FileProcessorTermsProps> = ({
  showTerms,
  setShowTerms,
  handleTermsAccept,
  termsAcceptOptions,
  fileName
}) => {
  return (
    <TermsDialog
      open={showTerms}
      onClose={() => setShowTerms(false)}
      onAccept={() => handleTermsAccept(termsAcceptOptions)}
      fileName={fileName}
    />
  );
};

export default FileProcessorTerms;
