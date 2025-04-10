
import React, { useEffect } from 'react';
import { Tabs as UITabs, TabsContent } from "@/components/ui/tabs";
import { Chapter } from '@/utils/textExtraction';
import { FileProcessorProvider } from '@/context/FileProcessorContext';
import { useProcessorLogic } from '@/hooks/file-processor/useProcessorLogic';
import { ConversionOptions } from '@/hooks/file-processor/useConversionActions';
import FileProcessorLayout from './file-processor/FileProcessorLayout';

interface FileProcessorProps {
  selectedFile: File;
  extractedText: string;
  chapters: Chapter[];
  detectedLanguage: string;
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => void;
  onStepComplete?: () => void;
  currentStep: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
}

const FileProcessor: React.FC<FileProcessorProps> = ({
  selectedFile,
  extractedText,
  chapters,
  detectedLanguage,
  onFileSelect,
  onStepComplete,
  currentStep,
  onNextStep,
  onPreviousStep
}) => {
  const processorLogic = useProcessorLogic({
    selectedFile,
    extractedText,
    chapters,
    onFileSelect,
    currentStep,
    onNextStep,
    onPreviousStep,
    onStepComplete
  });

  const {
    selectedVoice, 
    setSelectedVoice,
    notifyOnComplete, 
    setNotifyOnComplete,
    activeTab, 
    setActiveTab,
    conversionLogic,
    showTerms,
    setShowTerms,
    handleStartConversion,
    handleTermsAccept,
    handleGoBack,
    resetConversion,
    isProcessingNextStep
  } = processorLogic;

  // Create options object to pass to terms accept function
  const termsAcceptOptions: ConversionOptions = {
    selectedVoice,
    notifyOnComplete
  };

  useEffect(() => {
    if (currentStep === 2) {
      setActiveTab("voice-settings");
    } else if (currentStep === 3) {
      setActiveTab("conversion");
    } else {
      setActiveTab("file-info");
    }
  }, [currentStep, setActiveTab]);

  const contextValue = {
    selectedFile,
    extractedText,
    chapters,
    detectedLanguage,
    currentStep,
    onFileSelect,
    onNextStep,
    onPreviousStep,
    onStepComplete
  };

  return (
    <FileProcessorProvider value={contextValue}>
      <FileProcessorLayout 
        processorLogic={processorLogic}
        termsAcceptOptions={termsAcceptOptions}
        activeTab={activeTab}
        handleTermsAccept={handleTermsAccept}
        onTabChange={setActiveTab}
        typedConversionStatus={conversionLogic.conversionStatus as "idle" | "converting" | "completed" | "error"}
        conversionLogic={conversionLogic}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        notifyOnComplete={notifyOnComplete}
        setNotifyOnComplete={setNotifyOnComplete}
        handleStartConversion={handleStartConversion}
        resetConversion={resetConversion}
        handleGoBack={handleGoBack}
        isProcessingNextStep={isProcessingNextStep}
        selectedFile={selectedFile}
      />
    </FileProcessorProvider>
  );
};

export default FileProcessor;
