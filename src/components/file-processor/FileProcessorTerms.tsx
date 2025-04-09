
import React from 'react';
import TermsDialog from '../TermsDialog';

interface FileProcessorTermsProps {
  showTerms: boolean;
  setShowTerms: (show: boolean) => void;
  handleTermsAccept: () => Promise<void>;
  fileName?: string;
}

const FileProcessorTerms: React.FC<FileProcessorTermsProps> = ({
  showTerms,
  setShowTerms,
  handleTermsAccept,
  fileName
}) => {
  return (
    <TermsDialog
      open={showTerms}
      onClose={() => setShowTerms(false)}
      onAccept={handleTermsAccept}
      fileName={fileName}
    />
  );
};

export default FileProcessorTerms;
