
import React, { useEffect, memo, useMemo } from 'react';
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

// Use memo to prevent unnecessary re-renders
const MainContent = memo(({
  currentStep,
  selectedFile,
  extractedText,
  chapters,
  detectedLanguage,
  onFileSelect,
  onNextStep,
  onPreviousStep
}: MainContentProps) => {
  
  // Only log when dependencies actually change to avoid excessive re-renders
  useEffect(() => {
    console.log('MainContent rendered with:', {
      currentStep,
      hasFile: !!selectedFile,
      textLength: extractedText?.length || 0,
      chaptersCount: chapters?.length || 0,
      language: detectedLanguage
    });
  }, [
    currentStep, 
    selectedFile ? selectedFile.name : null, 
    extractedText?.length, 
    chapters?.length, 
    detectedLanguage
  ]);

  // Memoize the onStepComplete handler to prevent unnecessary re-renders
  const handleStepComplete = useMemo(() => {
    return () => {
      console.log('FileProcessor completed step, advancing to next step');
      onNextStep();
    };
  }, [onNextStep]);

  // Memoize the FileProcessor props to prevent re-renders
  const fileProcessorProps = useMemo(() => ({
    onFileSelect,
    selectedFile,
    extractedText,
    chapters,
    detectedLanguage,
    onStepComplete: handleStepComplete,
    currentStep,
    onNextStep,
    onPreviousStep
  }), [
    onFileSelect,
    selectedFile,
    extractedText,
    chapters,
    detectedLanguage,
    handleStepComplete,
    currentStep,
    onNextStep,
    onPreviousStep
  ]);

  return (
    <Card className="p-6 shadow-lg mb-10">
      {currentStep === 1 && (
        <div className="animate-fade-up">
          <FileUploadZone onFileSelect={onFileSelect} />
        </div>
      )}

      {currentStep >= 2 && selectedFile && (
        <div className="animate-fade-up">
          <FileProcessor {...fileProcessorProps} />
        </div>
      )}
    </Card>
  );
});

// Add displayName for debugging
MainContent.displayName = 'MainContent';

export default MainContent;
