
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Chapter } from '@/utils/textExtraction';
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "@/hooks/use-toast";
import { FileProcessorProvider } from '@/context/FileProcessorContext';
import ChapterDetectionState from './file-processor/ChapterDetectionState';
import BackButton from './file-processor/BackButton';
import ProcessorTabs from './file-processor/ProcessorTabs';
import ProcessorTabContent from './file-processor/ProcessorTabContent';
import FileProcessorTerms from './file-processor/FileProcessorTerms';
import { useConversionLogic } from './file-processor/useConversionLogic';

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

  const conversionLogic = useConversionLogic(selectedFile, extractedText, chapters, onStepComplete);
  const {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    showTerms,
    setShowTerms,
    conversionStatus,
    resetConversion,
    initiateConversion,
    handleAcceptTerms
  } = conversionLogic;

  useEffect(() => {
    if (currentStep === 2) {
      setActiveTab("voice-settings");
    } else if (currentStep === 3) {
      setActiveTab("conversion");
    } else {
      setActiveTab("file-info");
    }
  }, [currentStep]);

  useEffect(() => {
    if (conversionStatus === 'completed' && currentStep === 2) {
      console.log('FileProcessor - Conversion completed, moving to next step');
      onNextStep();
    }
  }, [conversionStatus, currentStep, onNextStep]);

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
    
    if (isProcessingNextStep) {
      console.log('FileProcessor - Already processing, ignoring request');
      return false;
    }
    
    setIsProcessingNextStep(true);
    
    try {
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
        console.log('FileProcessor - Terms will be shown');
        return true;
      }

      console.log('FileProcessor - Starting conversion directly');
      onNextStep();
      
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
      if (currentStep === 2) {
        console.log('FileProcessor - Moving to next step after terms acceptance');
        onNextStep();
      }
      
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

  if (detectingChapters) {
    return (
      <ChapterDetectionState 
        onSkip={() => {
          console.log('FileProcessor - Manual skip of chapter detection');
          setDetectChapters(false);
        }} 
      />
    );
  }

  return (
    <FileProcessorProvider value={contextValue}>
      <FileProcessorTerms
        showTerms={showTerms}
        setShowTerms={setShowTerms}
        handleTermsAccept={handleTermsAccept}
      />
      
      <BackButton
        conversionStatus={conversionStatus}
        detectingChapters={detectingChapters}
        isProcessingNextStep={isProcessingNextStep}
        resetConversion={resetConversion}
        onGoBack={handleGoBack}
      />

      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <ProcessorTabs />

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 transition-all">
          <ProcessorTabContent
            activeTab={activeTab}
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            notifyOnComplete={notifyOnComplete}
            setNotifyOnComplete={setNotifyOnComplete}
            detectChapters={detectChapters}
            setDetectChapters={setDetectChapters}
            handleStartConversion={handleStartConversion}
            conversionLogic={conversionLogic}
            resetConversion={resetConversion}
            detectingChapters={detectingChapters}
          />
        </div>
      </Tabs>
    </FileProcessorProvider>
  );
};

export default FileProcessor;
