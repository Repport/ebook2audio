
import React from 'react';
import { Card } from '@/components/ui/card';
import FileUploadZone from '@/components/FileUploadZone';
import FileProcessor from '@/components/FileProcessor';
import { Chapter } from '@/utils/textExtraction';

interface MainContentProps {
  currentStep: number;
  selectedFile: File | null;
  extractedText: string;
  chapters: Chapter[];
  detectedLanguage: string;
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
}

const MainContent = ({
  currentStep,
  selectedFile,
  extractedText,
  chapters,
  detectedLanguage,
  onFileSelect,
  onNextStep,
  onPreviousStep
}: MainContentProps) => {
  return (
    <Card className="p-6 shadow-lg mb-10">
      {currentStep === 1 && (
        <div className="animate-fade-up">
          <FileUploadZone onFileSelect={onFileSelect} />
        </div>
      )}

      {currentStep >= 2 && selectedFile && (
        <div className="animate-fade-up">
          <FileProcessor
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
            extractedText={extractedText}
            chapters={chapters}
            detectedLanguage={detectedLanguage}
            onStepComplete={() => onNextStep()}
            currentStep={currentStep}
            onNextStep={onNextStep}
            onPreviousStep={onPreviousStep}
          />
        </div>
      )}
    </Card>
  );
};

export default MainContent;
