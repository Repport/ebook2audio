
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
    conversionId
  } = useConversionLogic(selectedFile, extractedText, chapters, onStepComplete);

  // Cambiar la pestaña activa cuando cambia el paso
  useEffect(() => {
    if (currentStep === 2) {
      setActiveTab("voice-settings");
    } else if (currentStep === 3) {
      setActiveTab("conversion");
    }
  }, [currentStep]);

  // Efecto para manejar cambios en el estado de conversión
  useEffect(() => {
    if (conversionStatus === 'completed' && currentStep === 2) {
      onNextStep();
    }
  }, [conversionStatus, currentStep, onNextStep]);

  const handleStartConversion = async () => {
    // Verificar que todos los datos necesarios estén presentes
    if (!selectedFile || !extractedText || !selectedVoice) {
      return false;
    }

    const canConvert = await initiateConversion();
    if (!canConvert) return false;

    if (showTerms) {
      // Los términos se mostrarán, esperamos a la aceptación
      return true;
    }

    // Si no necesitamos mostrar términos, iniciar conversión directamente
    await handleAcceptTerms({
      selectedVoice,
      notifyOnComplete
    });

    return true;
  };

  const handleTermsAccept = async () => {
    setShowTerms(false);
    await handleAcceptTerms({
      selectedVoice,
      notifyOnComplete
    });
  };

  const estimatedSeconds = calculateEstimatedSeconds();

  if (detectingChapters) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" />
        <p className="text-lg mt-4">Detectando capítulos...</p>
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

      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="file-info" disabled={currentStep > 2}>Información del Archivo</TabsTrigger>
          <TabsTrigger value="voice-settings" disabled={currentStep < 2}>Configuración de Voz</TabsTrigger>
          <TabsTrigger value="conversion" disabled={currentStep < 3}>Conversión y Descarga</TabsTrigger>
        </TabsList>

        <TabsContent value="file-info">
          <Card className="p-4">
            <FileInfo
              file={selectedFile}
              onRemove={() => onFileSelect(null)}
              onNext={onNextStep}
            />
          </Card>
        </TabsContent>

        <TabsContent value="voice-settings">
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

        <TabsContent value="conversion">
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
      </Tabs>
    </>
  );
};

export default FileProcessor;
