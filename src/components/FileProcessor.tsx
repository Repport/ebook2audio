
import React, { useEffect } from 'react';
import { Tabs as UITabs, TabsContent } from "@/components/ui/tabs";
import { Chapter } from '@/utils/textExtraction';
import { FileProcessorProvider } from '@/context/FileProcessorContext';
import BackButton from './file-processor/BackButton';
import ErrorHandler from './file-processor/ErrorHandler';
import Tabs from './file-processor/Tabs';
import TabContent from './file-processor/TabContent';
import FileProcessorTerms from './file-processor/FileProcessorTerms';
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
    showTerms,
    setShowTerms,
    handleStartConversion,
    handleTermsAccept,
    handleGoBack,
    resetConversion,
    isProcessingNextStep
  } = processorLogic;

  useEffect(() => {
    if (currentStep === 2) {
      setActiveTab("voice-settings");
    } else if (currentStep === 3) {
      setActiveTab("conversion");
    } else {
      setActiveTab("file-info");
    }
  }, [currentStep, setActiveTab]);

  const handleErrorReset = () => {
    console.log('FileProcessor - Handling error recovery');
    resetConversion();
    if (currentStep === 3) {
      onPreviousStep();
    }
  };

  const handleTabChange = (tab: string) => {
    console.log('FileProcessor - Tab changed to:', tab);
    
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

  return (
    <ErrorHandler onReset={handleErrorReset}>
      <FileProcessorProvider value={contextValue}>
        <FileProcessorTerms
          showTerms={showTerms}
          setShowTerms={setShowTerms}
          handleTermsAccept={handleTermsAccept}
        />
        
        <BackButton
          conversionStatus={conversionLogic.conversionStatus}
          detectingChapters={false} // Removed chapter detection
          isProcessingNextStep={isProcessingNextStep}
          resetConversion={resetConversion}
          onGoBack={handleGoBack}
        />

        <UITabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <Tabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
          />

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 transition-all">
            <ErrorHandler onReset={handleErrorReset}>
              <TabsContent value="file-info" className="mt-0">
                <TabContent
                  activeTab="file-info"
                  selectedVoice={selectedVoice}
                  setSelectedVoice={setSelectedVoice}
                  notifyOnComplete={notifyOnComplete}
                  setNotifyOnComplete={setNotifyOnComplete}
                  detectChapters={false} // Removed chapter detection
                  setDetectChapters={() => {}} // Empty function
                  handleStartConversion={handleStartConversion}
                  conversionLogic={conversionLogic}
                  resetConversion={resetConversion}
                  detectingChapters={false} // Removed chapter detection
                />
              </TabsContent>
              
              <TabsContent value="voice-settings" className="mt-0">
                <TabContent
                  activeTab="voice-settings"
                  selectedVoice={selectedVoice}
                  setSelectedVoice={setSelectedVoice}
                  notifyOnComplete={notifyOnComplete}
                  setNotifyOnComplete={setNotifyOnComplete}
                  detectChapters={false} // Removed chapter detection
                  setDetectChapters={() => {}} // Empty function
                  handleStartConversion={handleStartConversion}
                  conversionLogic={conversionLogic}
                  resetConversion={resetConversion}
                  detectingChapters={false} // Removed chapter detection
                />
              </TabsContent>
              
              <TabsContent value="conversion" className="mt-0">
                <TabContent
                  activeTab="conversion"
                  selectedVoice={selectedVoice}
                  setSelectedVoice={setSelectedVoice}
                  notifyOnComplete={notifyOnComplete}
                  setNotifyOnComplete={setNotifyOnComplete}
                  detectChapters={false} // Removed chapter detection
                  setDetectChapters={() => {}} // Empty function
                  handleStartConversion={handleStartConversion}
                  conversionLogic={conversionLogic}
                  resetConversion={resetConversion}
                  detectingChapters={false} // Removed chapter detection
                />
              </TabsContent>
            </ErrorHandler>
          </div>
        </UITabs>
      </FileProcessorProvider>
    </ErrorHandler>
  );
};

export default FileProcessor;
