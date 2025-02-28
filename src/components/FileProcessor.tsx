
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileInfo from './FileInfo';
import VoiceSettingsStep from './VoiceSettingsStep';
import ConversionStep from './file-processor/ConversionStep';
import { Chapter } from '@/utils/textExtraction';
import { useConversionLogic } from './file-processor/useConversionLogic';
import TermsDialog from './TermsDialog';
import { LoadingSpinner } from './ui/spinner';
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

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
  const { translations } = useLanguage();
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [notifyOnComplete, setNotifyOnComplete] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("file-info");

  const {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    showTerms,
    setShowTerms,
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    elapsedTime,
    initiateConversion,
    handleAcceptTerms,
    handleDownloadClick,
    handleViewConversions,
    calculateEstimatedSeconds,
    conversionId,
    resetConversion
  } = useConversionLogic(selectedFile, extractedText, chapters, onStepComplete);

  // Cambiar la pestaña activa cuando cambia el paso
  useEffect(() => {
    if (currentStep === 2) {
      setActiveTab("voice-settings");
    } else if (currentStep === 3) {
      setActiveTab("conversion");
    } else {
      setActiveTab("file-info");
    }
  }, [currentStep]);

  // Efecto para manejar cambios en el estado de conversión
  useEffect(() => {
    if (conversionStatus === 'completed' && currentStep === 2) {
      onNextStep();
    }
  }, [conversionStatus, currentStep, onNextStep]);

  // Añadir un timeout para salir del estado "detectingChapters"
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (detectingChapters) {
      timeoutId = setTimeout(() => {
        setDetectChapters(false);
      }, 10000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [detectingChapters, setDetectChapters]);

  const handleStartConversion = async () => {
    if (!selectedFile || !extractedText || !selectedVoice) {
      return false;
    }

    if (detectingChapters) {
      setDetectChapters(false);
    }

    const canConvert = await initiateConversion();
    if (!canConvert) {
      return false;
    }

    if (showTerms) {
      return true;
    }

    await handleAcceptTerms({
      selectedVoice,
      notifyOnComplete
    });

    if (currentStep === 2) {
      onNextStep();
    }

    return true;
  };

  const handleTermsAccept = async () => {
    setShowTerms(false);
    await handleAcceptTerms({
      selectedVoice,
      notifyOnComplete
    });
    
    if (currentStep === 2) {
      onNextStep();
    }
  };

  const handleGoBack = () => {
    if (conversionStatus !== 'converting' && !detectingChapters) {
      if (currentStep > 1) {
        onPreviousStep();
      } else {
        resetConversion();
        onFileSelect(null);
      }
    }
  };

  const estimatedSeconds = calculateEstimatedSeconds();

  if (detectingChapters) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        <LoadingSpinner size="lg" />
        <p className="text-lg mt-4 text-gray-700 dark:text-gray-300">{translations.detectingChapters || "Detecting chapters..."}</p>
        <Button 
          variant="outline" 
          className="mt-4 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" 
          onClick={() => setDetectChapters(false)}
        >
          Skip chapter detection
        </Button>
      </div>
    );
  }

  return (
    <>
      <TermsDialog
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={handleTermsAccept}
      />
      
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={handleGoBack}
          disabled={conversionStatus === 'converting' || detectingChapters}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          {translations.back || "Back"}
        </Button>
      </div>

      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
          <TabsTrigger 
            value="file-info" 
            disabled={currentStep > 2}
            className="rounded-full py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-800 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            {translations.fileInfo || "File Information"}
          </TabsTrigger>
          <TabsTrigger 
            value="voice-settings" 
            disabled={currentStep < 2}
            className="rounded-full py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-800 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            {translations.voiceSettings || "Voice Settings"}
          </TabsTrigger>
          <TabsTrigger 
            value="conversion" 
            disabled={currentStep < 3}
            className="rounded-full py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-800 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            {translations.conversionAndDownload || "Conversion & Download"}
          </TabsTrigger>
        </TabsList>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 transition-all">
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
              conversionStatus={conversionStatus}
              progress={progress}
              audioData={audioData}
              audioDuration={audioDuration}
              estimatedSeconds={estimatedSeconds}
              onConvert={handleStartConversion}
              onDownloadClick={handleDownloadClick}
              onViewConversions={handleViewConversions}
              conversionId={conversionId}
              chapters={chapters}
              detectingChapters={detectingChapters}
              textLength={extractedText.length}
              elapsedTime={elapsedTime}
            />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
};

export default FileProcessor;
