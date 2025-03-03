
import React, { createContext, useContext, ReactNode } from 'react';
import { Chapter } from '@/utils/textExtraction';

interface FileProcessorContextType {
  selectedFile: File | null;
  extractedText: string;
  chapters: Chapter[];
  detectedLanguage: string;
  currentStep: number;
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onStepComplete?: () => void;
}

const FileProcessorContext = createContext<FileProcessorContextType | undefined>(undefined);

export const useFileProcessor = (): FileProcessorContextType => {
  const context = useContext(FileProcessorContext);
  if (!context) {
    throw new Error('useFileProcessor must be used within a FileProcessorProvider');
  }
  return context;
};

interface FileProcessorProviderProps {
  children: ReactNode;
  value: FileProcessorContextType;
}

export const FileProcessorProvider: React.FC<FileProcessorProviderProps> = ({ 
  children, 
  value 
}) => {
  return (
    <FileProcessorContext.Provider value={value}>
      {children}
    </FileProcessorContext.Provider>
  );
};
