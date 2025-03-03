
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import FileInfo from '../FileInfo';
import VoiceSettingsStep from '../VoiceSettingsStep';
import ConversionStep from './ConversionStep';
import { useFileProcessor } from '@/context/FileProcessorContext';

interface ProcessorTabContentProps {
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

const ProcessorTabContent: React.FC<ProcessorTabContentProps> = ({
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

  return (
    <>
      <TabsContent value="file-info" className="mt-0">
        <FileInfo
          file={selectedFile}
          onRemove={() => {
            resetConversion();
            onFileSelect(null);
          }}
          onNext={onNextStep}
        />
      </TabsContent>

      <TabsContent value="voice-settings" className="mt-0">
        <VoiceSettingsStep
          detectedLanguage={detectedLanguage}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          detectChapters={detectChapters}
          setDetectChapters={setDetectChapters}
          notifyOnComplete={notifyOnComplete}
          setNotifyOnComplete={setNotifyOnComplete}
          onNextStep={handleStartConversion}
        />
      </TabsContent>

      <TabsContent value="conversion" className="mt-0">
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
          detectingChapters={detectingChapters}
          textLength={extractedText.length}
          elapsedTime={conversionLogic.elapsedTime}
        />
      </TabsContent>
    </>
  );
};

export default ProcessorTabContent;
