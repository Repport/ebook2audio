
import React from 'react';
import FileInfo from '../FileInfo';
import VoiceSettingsStep from '../VoiceSettingsStep';
import ConversionStep from './ConversionStep';
import { useFileProcessor } from '@/context/FileProcessorContext';

interface TabContentProps {
  activeTab: string;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  notifyOnComplete: boolean;
  setNotifyOnComplete: (notify: boolean) => void;
  detectChapters: boolean;
  setDetectChapters: (detect: boolean) => void;
  handleStartConversion: () => Promise<boolean>;
  conversionLogic: {
    conversionStatus: 'idle' | 'converting' | 'completed' | 'error';
    progress: number;
    audioData: ArrayBuffer | null;
    audioDuration: number;
    elapsedTime: number;
    handleDownloadClick: () => void;
    handleViewConversions: () => void;
    conversionId: string | null;
    calculateEstimatedSeconds: () => number;
  };
  resetConversion: () => void;
  detectingChapters: boolean;
}

const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  selectedVoice,
  setSelectedVoice,
  notifyOnComplete,
  setNotifyOnComplete,
  detectChapters,
  setDetectChapters,
  handleStartConversion,
  conversionLogic,
  resetConversion,
  detectingChapters
}) => {
  const { 
    selectedFile, 
    extractedText, 
    chapters, 
    detectedLanguage,
    onFileSelect,
    onNextStep
  } = useFileProcessor();
  
  const estimatedSeconds = conversionLogic.calculateEstimatedSeconds();
  
  if (!selectedFile) return null;

  // Render appropriate component based on activeTab
  if (activeTab === "file-info") {
    return (
      <FileInfo
        file={selectedFile}
        onRemove={() => {
          resetConversion();
          onFileSelect(null);
        }}
        onNext={onNextStep}
      />
    );
  }

  if (activeTab === "voice-settings") {
    return (
      <VoiceSettingsStep
        detectedLanguage={detectedLanguage}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        notifyOnComplete={notifyOnComplete}
        setNotifyOnComplete={setNotifyOnComplete}
        onNextStep={handleStartConversion}
      />
    );
  }

  if (activeTab === "conversion") {
    return (
      <ConversionStep
        selectedFile={selectedFile}
        conversionStatus={conversionLogic.conversionStatus}
        progress={conversionLogic.progress}
        audioData={conversionLogic.audioData}
        audioDuration={conversionLogic.audioDuration}
        estimatedSeconds={estimatedSeconds}
        onConvert={handleStartConversion}
        onDownloadClick={conversionLogic.handleDownloadClick}
        onViewConversions={conversionLogic.handleViewConversions}
        conversionId={conversionLogic.conversionId}
        chapters={chapters}
        detectingChapters={false}
        textLength={extractedText.length}
        elapsedTime={conversionLogic.elapsedTime}
      />
    );
  }

  return null;
};

export default TabContent;
