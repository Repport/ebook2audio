
import React from 'react';
import { useProcessorLogic } from '@/hooks/file-processor/useProcessorLogic';
import { ConversionOptions } from '@/hooks/file-processor/useConversionActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileInfo from '@/components/file-processor/FileInfo';
import VoiceSettings from '@/components/file-processor/VoiceSettings';
import ConversionStep from './ConversionStep';
import FileProcessorTerms from './FileProcessorTerms';

interface FileProcessorLayoutProps {
  processorLogic: ReturnType<typeof useProcessorLogic>;
  termsAcceptOptions: ConversionOptions;
  activeTab: string;
  onTabChange: (value: string) => void;
  typedConversionStatus: 'idle' | 'converting' | 'completed' | 'error';
  conversionLogic: any;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  notifyOnComplete: boolean;
  setNotifyOnComplete: (notify: boolean) => void;
  handleStartConversion: () => Promise<boolean>;
  resetConversion: () => void;
  handleGoBack: () => void;
  handleTermsAccept: (options: ConversionOptions) => Promise<void>;
  isProcessingNextStep: boolean;
  selectedFile: File;
}

const FileProcessorLayout: React.FC<FileProcessorLayoutProps> = ({
  processorLogic,
  termsAcceptOptions,
  activeTab,
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
  handleTermsAccept,
  isProcessingNextStep,
  selectedFile
}) => {
  return (
    <div className="space-y-6">
      {/* Terms Dialog */}
      <FileProcessorTerms
        showTerms={processorLogic.showTerms}
        setShowTerms={processorLogic.setShowTerms}
        handleTermsAccept={handleTermsAccept}
        termsAcceptOptions={termsAcceptOptions}
        fileName={selectedFile?.name}
      />

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="file-info">File Info</TabsTrigger>
          <TabsTrigger value="voice-settings">Voice Settings</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
        </TabsList>

        <TabsContent value="file-info" className="pt-4">
          <FileInfo
            file={selectedFile}
            onRemove={resetConversion}
            onNext={processorLogic.goToNextTab}
          />
        </TabsContent>

        <TabsContent value="voice-settings" className="pt-4">
          <VoiceSettings
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            notifyOnComplete={notifyOnComplete}
            setNotifyOnComplete={setNotifyOnComplete}
            onStartConversion={handleStartConversion}
            onBack={handleGoBack}
            isProcessingNextStep={isProcessingNextStep}
          />
        </TabsContent>

        <TabsContent value="conversion" className="pt-4">
          <ConversionStep
            selectedFile={selectedFile}
            conversionStatus={typedConversionStatus}
            progress={conversionLogic.progress || 0}
            audioData={conversionLogic.audioData}
            audioDuration={conversionLogic.audioDuration || 0}
            estimatedSeconds={conversionLogic.calculateEstimatedSeconds ? conversionLogic.calculateEstimatedSeconds() : 0}
            onConvert={handleStartConversion}
            onDownloadClick={conversionLogic.handleDownloadClick}
            onViewConversions={conversionLogic.handleViewConversions}
            conversionId={conversionLogic.conversionId}
            chapters={processorLogic.chapters}
            detectingChapters={processorLogic.detectingChapters}
            textLength={processorLogic.extractedText?.length || 0}
            elapsedTime={conversionLogic.elapsedTime}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FileProcessorLayout;
