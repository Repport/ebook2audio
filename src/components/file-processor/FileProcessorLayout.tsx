import React from 'react';
import { Tabs as UITabs, TabsContent } from "@/components/ui/tabs";
import { ConversionOptions } from '@/hooks/file-processor/useConversionActions';
import BackButton from './BackButton';
import ErrorHandler from './ErrorHandler';
import Tabs from './Tabs';
import TabContent from './TabContent';
import FileProcessorTerms from './FileProcessorTerms';

interface FileProcessorLayoutProps {
  processorLogic: any;
  termsAcceptOptions: ConversionOptions;
  activeTab: string;
  handleTermsAccept: (options: ConversionOptions) => Promise<void>;
  onTabChange: (tab: string) => void;
  typedConversionStatus: "idle" | "converting" | "completed" | "error";
  conversionLogic: any;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  notifyOnComplete: boolean;
  setNotifyOnComplete: (notify: boolean) => void;
  handleStartConversion: () => Promise<boolean>;
  resetConversion: () => void;
  handleGoBack: () => void;
  isProcessingNextStep: boolean;
  selectedFile: File;
}

const FileProcessorLayout: React.FC<FileProcessorLayoutProps> = ({
  processorLogic,
  termsAcceptOptions,
  activeTab,
  handleTermsAccept,
  onTabChange,
  typedConversionStatus,
  conversionLogic,
  selectedVoice,
  setSelectedVoice,
  notifyOnComplete,
  setNotifyOnComplete,
  handleStartConversion,
  resetConversion,
  handleGoBack,
  isProcessingNextStep,
  selectedFile
}) => {
  const { showTerms, setShowTerms } = processorLogic;
  
  const handleErrorReset = () => {
    console.log('FileProcessor - Handling error recovery');
    resetConversion();
    if (processorLogic.currentStep === 3) {
      processorLogic.onPreviousStep();
    }
  };

  const handleTabChange = (tab: string) => {
    console.log('FileProcessor - Tab changed to:', tab);
    
    if (tab === "file-info" || 
        (tab === "voice-settings" && processorLogic.currentStep >= 2) || 
        (tab === "conversion" && processorLogic.currentStep >= 3)) {
      onTabChange(tab);
    }
  };

  const handleDownloadClick = () => {
    conversionLogic.handleDownloadClick();
  };
  
  const handleViewConversions = () => {
    conversionLogic.handleViewConversions();
  };

  return (
    <ErrorHandler onReset={handleErrorReset}>
      <FileProcessorTerms
        showTerms={showTerms}
        setShowTerms={setShowTerms}
        handleTermsAccept={() => handleTermsAccept(termsAcceptOptions)}
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
            <TabContentWrapper
              activeTab={activeTab}
              selectedVoice={selectedVoice}
              setSelectedVoice={setSelectedVoice}
              notifyOnComplete={notifyOnComplete}
              setNotifyOnComplete={setNotifyOnComplete}
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
            />
          </ErrorHandler>
        </div>
      </UITabs>
    </ErrorHandler>
  );
};

// Extract TabContentWrapper to keep the component structure clean
const TabContentWrapper: React.FC<{
  activeTab: string;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  notifyOnComplete: boolean;
  setNotifyOnComplete: (notify: boolean) => void;
  handleStartConversion: () => Promise<boolean>;
  conversionLogic: any;
  resetConversion: () => void;
}> = (props) => {
  return (
    <>
      <TabsContent value="file-info" className="mt-0">
        <TabContent
          activeTab="file-info"
          selectedVoice={props.selectedVoice}
          setSelectedVoice={props.setSelectedVoice}
          notifyOnComplete={props.notifyOnComplete}
          setNotifyOnComplete={props.setNotifyOnComplete}
          detectChapters={false}
          setDetectChapters={() => {}}
          handleStartConversion={props.handleStartConversion}
          conversionLogic={props.conversionLogic}
          resetConversion={props.resetConversion}
          detectingChapters={false}
        />
      </TabsContent>
      
      <TabsContent value="voice-settings" className="mt-0">
        <TabContent
          activeTab="voice-settings"
          selectedVoice={props.selectedVoice}
          setSelectedVoice={props.setSelectedVoice}
          notifyOnComplete={props.notifyOnComplete}
          setNotifyOnComplete={props.setNotifyOnComplete}
          detectChapters={false}
          setDetectChapters={() => {}}
          handleStartConversion={props.handleStartConversion}
          conversionLogic={props.conversionLogic}
          resetConversion={props.resetConversion}
          detectingChapters={false}
        />
      </TabsContent>
      
      <TabsContent value="conversion" className="mt-0">
        <TabContent
          activeTab="conversion"
          selectedVoice={props.selectedVoice}
          setSelectedVoice={props.setSelectedVoice}
          notifyOnComplete={props.notifyOnComplete}
          setNotifyOnComplete={props.setNotifyOnComplete}
          detectChapters={false}
          setDetectChapters={() => {}}
          handleStartConversion={props.handleStartConversion}
          conversionLogic={props.conversionLogic}
          resetConversion={props.resetConversion}
          detectingChapters={false}
        />
      </TabsContent>
    </>
  );
};

export default FileProcessorLayout;
