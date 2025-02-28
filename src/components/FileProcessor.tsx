
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

  // Logs para depuración
  useEffect(() => {
    console.log('FileProcessor - Current state:', {
      currentStep,
      activeTab,
      detectingChapters,
      conversionStatus,
      progress
    });
  }, [currentStep, activeTab, detectingChapters, conversionStatus, progress]);

  // Resetear el estado de conversión cuando se cambia de archivo
  useEffect(() => {
    console.log('FileProcessor - File changed, resetting conversion');
    resetConversion();
  }, [selectedFile, resetConversion]);

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
      console.log('FileProcessor - Conversion completed, moving to next step');
      onNextStep();
    }
  }, [conversionStatus, currentStep, onNextStep]);

  // Añadir un timeout para salir del estado "detectingChapters" si se queda atascado
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (detectingChapters) {
      console.log('FileProcessor - Chapter detection started, setting safety timeout');
      timeoutId = setTimeout(() => {
        console.log('FileProcessor - Chapter detection safety timeout triggered');
        setDetectChapters(false);
        // Forzar salida del estado de detección de capítulos
        if (detectingChapters) {
          console.log('FileProcessor - Forcing exit from detecting chapters state');
          setDetectChapters(false);
        }
      }, 10000); // 10 segundos máximo para detectar capítulos
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [detectingChapters, setDetectChapters]);

  const handleStartConversion = async () => {
    console.log('FileProcessor - handleStartConversion called');
    // Verificar que todos los datos necesarios estén presentes
    if (!selectedFile || !extractedText || !selectedVoice) {
      console.log('FileProcessor - Missing required data for conversion');
      return false;
    }

    const canConvert = await initiateConversion();
    if (!canConvert) {
      console.log('FileProcessor - initiateConversion returned false');
      return false;
    }

    if (showTerms) {
      // Los términos se mostrarán, esperamos a la aceptación
      console.log('FileProcessor - Terms will be shown');
      return true;
    }

    // Si no necesitamos mostrar términos, iniciar conversión directamente
    console.log('FileProcessor - Starting conversion directly');
    await handleAcceptTerms({
      selectedVoice,
      notifyOnComplete
    });

    return true;
  };

  const handleTermsAccept = async () => {
    console.log('FileProcessor - Terms accepted');
    setShowTerms(false);
    await handleAcceptTerms({
      selectedVoice,
      notifyOnComplete
    });
  };

  const handleGoBack = () => {
    console.log('FileProcessor - handleGoBack called, conversionStatus:', conversionStatus);
    // Solo permitir volver si no estamos en medio de una conversión
    if (conversionStatus !== 'converting' && !detectingChapters) {
      if (currentStep > 1) {
        console.log('FileProcessor - Going to previous step');
        onPreviousStep();
      } else {
        console.log('FileProcessor - Returning to file selection');
        resetConversion();
        onFileSelect(null);
      }
    } else {
      console.log('FileProcessor - Cannot go back during conversion or chapter detection');
    }
  };

  const estimatedSeconds = calculateEstimatedSeconds();

  if (detectingChapters) {
    console.log('FileProcessor - Rendering chapter detection state');
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" />
        <p className="text-lg mt-4">{translations.detectingChapters || "Detecting chapters..."}</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => {
            console.log('FileProcessor - Manual skip of chapter detection');
            setDetectChapters(false);
          }}
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
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {translations.back || "Back"}
        </Button>
      </div>

      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="file-info" disabled={currentStep > 2}>{translations.fileInfo || "File Information"}</TabsTrigger>
          <TabsTrigger value="voice-settings" disabled={currentStep < 2}>{translations.voiceSettings || "Voice Settings"}</TabsTrigger>
          <TabsTrigger value="conversion" disabled={currentStep < 3}>{translations.conversionAndDownload || "Conversion & Download"}</TabsTrigger>
        </TabsList>

        <TabsContent value="file-info">
          <Card className="p-4">
            <FileInfo
              file={selectedFile}
              onRemove={() => {
                resetConversion();
                onFileSelect(null);
              }}
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
