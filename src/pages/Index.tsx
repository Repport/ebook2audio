import React, { useCallback, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StepsProgressBar from '@/components/steps/StepsProgressBar';
import MainContent from '@/components/home/MainContent';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { conversionSteps } from '@/constants/steps';
import { Chapter } from '@/utils/textExtraction';
import { Spinner } from '@/components/ui/spinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/shared/logging';

const Index = () => {
  const { toast } = useToast();
  const {
    selectedFile,
    setSelectedFile,
    extractedText,
    setExtractedText,
    chapters,
    setChapters,
    currentStep,
    setCurrentStep,
    detectedLanguage,
    setDetectedLanguage,
    isInitialized
  } = useSessionStorage();

  // Log page initialization
  useEffect(() => {
    logger.info('system', 'Application initialized', {
      isInitialized,
      currentStep,
      hasFile: !!selectedFile,
      textLength: extractedText.length
    });
  }, [isInitialized, currentStep, selectedFile, extractedText.length]);

  const handleFileSelect = useCallback(async (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => {
    try {
      if (!fileInfo) {
        logger.info('user', 'File selection cleared');
        setSelectedFile(null);
        setExtractedText('');
        setChapters([]);
        setDetectedLanguage('english');
        setCurrentStep(1);
        return;
      }

      logger.info('user', 'File selected for processing', {
        fileName: fileInfo.file.name,
        fileSize: fileInfo.file.size,
        textLength: fileInfo.text.length,
        language: fileInfo.language,
        chaptersCount: fileInfo.chapters?.length || 0
      });

      const updatesPromise = Promise.all([
        setSelectedFile(fileInfo.file),
        setExtractedText(fileInfo.text || ''),
        setChapters(fileInfo.chapters || []),
        setDetectedLanguage(fileInfo.language || 'english')
      ]);
      
      await updatesPromise;
      
      requestAnimationFrame(() => {
        setCurrentStep(2);
        logger.info('system', 'File processing completed, moved to step 2', {
          fileName: fileInfo.file.name,
          detectedLanguage: fileInfo.language
        });
      });
    } catch (error) {
      const processingError = error instanceof Error ? error : new Error('Unknown file processing error');
      logger.error('system', 'Error handling file selection', {
        error: processingError.message,
        fileName: fileInfo?.file.name
      });
      
      toast({
        title: "Error",
        description: "Something went wrong processing your file. Please try again.",
        variant: "destructive",
      });
    }
  }, [setSelectedFile, setExtractedText, setChapters, setDetectedLanguage, setCurrentStep, toast]);

  const goToNextStep = useCallback(() => {
    if (currentStep < conversionSteps.length) {
      const nextStep = Math.min(currentStep + 1, conversionSteps.length);
      setCurrentStep(nextStep);
      logger.info('user', 'Navigated to next step', { 
        fromStep: currentStep, 
        toStep: nextStep 
      });
    }
  }, [currentStep, setCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      const prevStep = Math.max(currentStep - 1, 1);
      setCurrentStep(prevStep);
      logger.info('user', 'Navigated to previous step', { 
        fromStep: currentStep, 
        toStep: prevStep 
      });
    }
  }, [currentStep, setCurrentStep]);

  const handleErrorReset = useCallback(() => {
    logger.warn('system', 'Application error reset triggered', {
      currentStep,
      hasFile: !!selectedFile,
      textLength: extractedText.length
    });
    
    setCurrentStep(1);
    setSelectedFile(null);
    setExtractedText('');
    setChapters([]);
    toast({
      title: "Application Reset",
      description: "The application has been reset due to an error.",
      variant: "default",
    });
  }, [setCurrentStep, setSelectedFile, setExtractedText, setChapters, toast, currentStep, selectedFile, extractedText.length]);

  const mainContentProps = useMemo(() => ({
    currentStep,
    selectedFile,
    extractedText,
    chapters,
    detectedLanguage,
    onFileSelect: handleFileSelect,
    onNextStep: goToNextStep,
    onPreviousStep: goToPreviousStep
  }), [
    currentStep, 
    selectedFile, 
    extractedText, 
    chapters, 
    detectedLanguage, 
    handleFileSelect, 
    goToNextStep, 
    goToPreviousStep
  ]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <main className="flex-grow container mx-auto py-8 px-4 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-gray-600 dark:text-gray-300">Loading application state...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Header />

          <div className="mt-10 mb-2">
            <StepsProgressBar steps={conversionSteps} currentStep={currentStep} />
          </div>

          <ErrorBoundary 
            componentName="MainContent" 
            onReset={handleErrorReset}
          >
            <MainContent {...mainContentProps} />
          </ErrorBoundary>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
