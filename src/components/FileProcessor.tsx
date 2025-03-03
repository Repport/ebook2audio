
import React, { useEffect } from 'react';
import { Tabs } from "@/components/ui/tabs";
import { Chapter } from '@/utils/textExtraction';
import { FileProcessorProvider } from '@/context/FileProcessorContext';
import ChapterDetectionState from './file-processor/ChapterDetectionState';
import BackButton from './file-processor/BackButton';
import ProcessorTabs from './file-processor/ProcessorTabs';
import ProcessorTabContent from './file-processor/ProcessorTabContent';
import FileProcessorTerms from './file-processor/FileProcessorTerms';
import ErrorBoundary from './ErrorBoundary';
import { useProcessorLogic } from '@/hooks/file-processor/useProcessorLogic';

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
    detectChapters,
    setDetectChapters,
    detectingChapters,
    showTerms,
    setShowTerms,
    handleStartConversion,
    handleTermsAccept,
    handleGoBack,
    resetConversion
  } = processorLogic;

  // Update activeTab based on currentStep
  useEffect(() => {
    if (currentStep === 2) {
      setActiveTab("voice-settings");
    } else if (currentStep === 3) {
      setActiveTab("conversion");
    } else {
      setActiveTab("file-info");
    }
  }, [currentStep, setActiveTab]);

  // Handle error recovery
  const handleErrorReset = () => {
    console.log('FileProcessor - Handling error recovery');
    resetConversion();
    if (currentStep === 3) {
      onPreviousStep();
    }
  };

  // Handle tab change without page navigation
  const handleTabChange = (tab: string) => {
    console.log('FileProcessor - Tab changed to:', tab);
    
    // Only allow navigation to tabs that are enabled based on currentStep
    if (tab === "file-info" || 
        (tab === "voice-settings" && currentStep >= 2) || 
        (tab === "conversion" && currentStep >= 3)) {
      setActiveTab(tab);
    }
  };

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

  if (detectingChapters) {
    return (
      <ChapterDetectionState 
        onSkip={() => {
          console.log('FileProcessor - Manual skip of chapter detection');
          setDetectChapters(false);
        }} 
      />
    );
  }

  return (
    <ErrorBoundary onReset={handleErrorReset}>
      <FileProcessorProvider value={contextValue}>
        <FileProcessorTerms
          showTerms={showTerms}
          setShowTerms={setShowTerms}
          handleTermsAccept={handleTermsAccept}
        />
        
        <BackButton
          conversionStatus={conversionLogic.conversionStatus}
          detectingChapters={detectingChapters}
          isProcessingNextStep={processorLogic.isProcessingNextStep}
          resetConversion={resetConversion}
          onGoBack={handleGoBack}
        />

        <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <ProcessorTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
          />

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 transition-all">
            <ErrorBoundary onReset={handleErrorReset}>
              <ProcessorTabContent
                activeTab={activeTab}
                selectedVoice={selectedVoice}
                setSelectedVoice={setSelectedVoice}
                notifyOnComplete={notifyOnComplete}
                setNotifyOnComplete={setNotifyOnComplete}
                detectChapters={detectChapters}
                setDetectChapters={setDetectChapters}
                handleStartConversion={handleStartConversion}
                conversionLogic={conversionLogic}
                resetConversion={resetConversion}
                detectingChapters={detectingChapters}
              />
            </ErrorBoundary>
          </div>
        </Tabs>
      </FileProcessorProvider>
    </ErrorBoundary>
  );
};

export default FileProcessor;
