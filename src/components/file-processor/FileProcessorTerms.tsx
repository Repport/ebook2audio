
import React from 'react';
import TermsDialog from '../TermsDialog';
import { useFileProcessor } from '@/context/FileProcessorContext';

interface FileProcessorTermsProps {
  showTerms: boolean;
  setShowTerms: (show: boolean) => void;
  handleTermsAccept: () => Promise<void>;
}

const FileProcessorTerms: React.FC<FileProcessorTermsProps> = ({
  showTerms,
  setShowTerms,
  handleTermsAccept
}) => {
  return (
    <TermsDialog
      open={showTerms}
      onClose={() => setShowTerms(false)}
      onAccept={handleTermsAccept}
    />
  );
};

export default FileProcessorTerms;
