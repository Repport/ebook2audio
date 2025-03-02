
import React, { useState, useEffect, useCallback } from 'react';
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
import { toast } from "@/hooks/use-toast";

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
  const [isProcessingNextStep, setIsProcessingNextStep] = useState(false);

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
      console.log('FileProcessor - Conversion completed, moving to next step');
      onNextStep();
    }
  }, [conversionStatus, currentStep, onNextStep]);

  // Añadir un timeout para salir del estado "detectingChapters"
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (detectingChapters) {
      console.log('FileProcessor - Chapter detection started, setting safety timeout');
      timeoutId = setTimeout(() => {
        console.log('FileProcessor - Chapter detection safety timeout triggered');
        setDetectChapters(false);
      }, 10000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [detectingChapters, setDetectChapters]);

  const handleStartConversion = useCallback(async () => {
    console.log('FileProcessor - handleStartConversion called');
    
    // Evitar múltiples envíos
    if (isProcessingNextStep) {
      console.log('FileProcessor - Already processing, ignoring request');
      return false;
    }
    
    setIsProcessingNextStep(true);
    
    try {
      // Verificar que todos los datos necesarios estén presentes
      if (!selectedFile || !extractedText || !selectedVoice) {
        console.log('FileProcessor - Missing required data for conversion', {
          hasFile: !!selectedFile,
          hasText: !!extractedText,
          selectedVoice
        });
        
        toast({
          title: "Error",
          description: "Missing required data for conversion",
          variant: "destructive",
        });
        
        setIsProcessingNextStep(false);
        return false;
      }

      // Detener cualquier detección de capítulos activa antes de iniciar la conversión
      if (detectingChapters) {
        setDetectChapters(false);
      }

      const canConvert = await initiateConversion();
      if (!canConvert) {
        console.log('FileProcessor - initiateConversion returned false');
        
        toast({
          title: "Error",
          description: "Unable to initiate conversion",
          variant: "destructive",
        });
        
        setIsProcessingNextStep(false);
        return false;
      }

      if (showTerms) {
        // Los términos se mostrarán, esperamos a la aceptación
        console.log('FileProcessor - Terms will be shown');
        // No desactivamos isProcessingNextStep aquí, lo haremos después de la aceptación
        return true;
      }

      // Si no necesitamos mostrar términos, iniciar conversión directamente e ir al siguiente paso
      console.log('FileProcessor - Starting conversion directly');
      onNextStep(); // Avanzar inmediatamente al siguiente paso
      
      // Iniciar la conversión después de avanzar
      await handleAcceptTerms({
        selectedVoice,
        notifyOnComplete
      });

      return true;
    } catch (error) {
      console.error('FileProcessor - Error in handleStartConversion:', error);
      
      toast({
        title: "Error",
        description: "An error occurred during conversion",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsProcessingNextStep(false);
    }
  }, [
    isProcessingNextStep, selectedFile, extractedText, selectedVoice, 
    detectingChapters, setDetectChapters, initiateConversion, showTerms, 
    handleAcceptTerms, notifyOnComplete, onNextStep
  ]);

  const handleTermsAccept = async () => {
    console.log('FileProcessor - Terms accepted');
    setShowTerms(false);
    
    try {
      // Avanzar al siguiente paso inmediatamente después de aceptar los términos
      if (currentStep === 2) {
        console.log('FileProcessor - Moving to next step after terms acceptance');
        onNextStep();
      }
      
      // Iniciar la conversión después de avanzar
      await handleAcceptTerms({
        selectedVoice,
        notifyOnComplete
      });
    } catch (error) {
      console.error('FileProcessor - Error in handleTermsAccept:', error);
      
      toast({
        title: "Error",
        description: "An error occurred while accepting terms",
        variant: "destructive",
      });
    } finally {
      setIsProcessingNextStep(false);
    }
  };

  const handleGoBack = () => {
    console.log('FileProcessor - handleGoBack called, conversionStatus:', conversionStatus);
    // Solo permitir volver si no estamos en medio de una conversión
    if (conversionStatus !== 'converting' && !detectingChapters && !isProcessingNextStep) {
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
      
      toast({
        title: "In Progress",
        description: "Please wait until the current process completes",
        variant: "default",
      });
    }
  };

  const estimatedSeconds = calculateEstimatedSeconds();

  if (detectingChapters) {
    console.log('FileProcessor - Rendering chapter detection state');
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        <LoadingSpinner size="lg" />
        <p className="text-lg mt-4 text-gray-700 dark:text-gray-300">{translations.detectingChapters || "Detecting chapters..."}</p>
        <Button 
          variant="outline" 
          className="mt-4 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" 
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
          disabled={conversionStatus === 'converting' || detectingChapters || isProcessingNextStep}
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
