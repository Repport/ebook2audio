
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

  // Create wrapper functions that don't require parameters
  const handleDownloadClick = () => {
    conversionLogic.handleDownloadClick();
  };
  
  // Create a viewConversions wrapper function
  const handleViewConversions = () => {
    conversionLogic.handleViewConversions();
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

  // Ensure conversion status is one of the allowed values
  const typedConversionStatus = conversionLogic.conversionStatus as "idle" | "converting" | "completed" | "error";

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
          handleTermsAccept={() => handleTermsAccept()}
          fileName={selectedFile.name}
        />
        
        <BackButton
          conversionStatus={typedConversionStatus}
          detectingChapters={false}
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
                  detectChapters={false}
                  setDetectChapters={() => {}}
                  handleStartConversion={handleStartConversion}
                  conversionLogic={{
                    conversionStatus: typedConversionStatus,
                    progress: conversionLogic.progress,
                    audioData: conversionLogic.audioData as ArrayBuffer,
                    audioDuration: conversionLogic.audioDuration,
                    elapsedTime: conversionLogic.elapsedTime,
                    handleDownloadClick: handleDownloadClick,
                    handleViewConversions: handleViewConversions,
                    conversionId: conversionLogic.conversionId,
                    calculateEstimatedSeconds: conversionLogic.calculateEstimatedSeconds
                  }}
                  resetConversion={resetConversion}
                  detectingChapters={false}
                />
              </TabsContent>
              
              <TabsContent value="voice-settings" className="mt-0">
                <TabContent
                  activeTab="voice-settings"
                  selectedVoice={selectedVoice}
                  setSelectedVoice={setSelectedVoice}
                  notifyOnComplete={notifyOnComplete}
                  setNotifyOnComplete={setNotifyOnComplete}
                  detectChapters={false}
                  setDetectChapters={() => {}}
                  handleStartConversion={handleStartConversion}
                  conversionLogic={{
                    conversionStatus: typedConversionStatus,
                    progress: conversionLogic.progress,
                    audioData: conversionLogic.audioData as ArrayBuffer,
                    audioDuration: conversionLogic.audioDuration,
                    elapsedTime: conversionLogic.elapsedTime,
                    handleDownloadClick: handleDownloadClick,
                    handleViewConversions: handleViewConversions,
                    conversionId: conversionLogic.conversionId,
                    calculateEstimatedSeconds: conversionLogic.calculateEstimatedSeconds
                  }}
                  resetConversion={resetConversion}
                  detectingChapters={false}
                />
              </TabsContent>
              
              <TabsContent value="conversion" className="mt-0">
                <TabContent
                  activeTab="conversion"
                  selectedVoice={selectedVoice}
                  setSelectedVoice={setSelectedVoice}
                  notifyOnComplete={notifyOnComplete}
                  setNotifyOnComplete={setNotifyOnComplete}
                  detectChapters={false}
                  setDetectChapters={() => {}}
                  handleStartConversion={handleStartConversion}
                  conversionLogic={{
                    conversionStatus: typedConversionStatus,
                    progress: conversionLogic.progress,
                    audioData: conversionLogic.audioData as ArrayBuffer,
                    audioDuration: conversionLogic.audioDuration,
                    elapsedTime: conversionLogic.elapsedTime,
                    handleDownloadClick: handleDownloadClick,
                    handleViewConversions: handleViewConversions,
                    conversionId: conversionLogic.conversionId,
                    calculateEstimatedSeconds: conversionLogic.calculateEstimatedSeconds
                  }}
                  resetConversion={resetConversion}
                  detectingChapters={false}
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
