
import React, { useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StepsProgressBar from '@/components/steps/StepsProgressBar';
import MainContent from '@/components/home/MainContent';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { conversionSteps } from '@/constants/steps';
import { Chapter } from '@/utils/textExtraction';
import { Spinner } from '@/components/ui/spinner';

const Index = () => {
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

  const handleFileSelect = useCallback(async (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => {
    if (!fileInfo) {
      setSelectedFile(null);
      setExtractedText('');
      setChapters([]);
      setDetectedLanguage('english');
      setCurrentStep(1);
      return;
    }

    // Batch update for related state to reduce renders
    setSelectedFile(fileInfo.file);
    setExtractedText(fileInfo.text);
    setChapters(fileInfo.chapters || []);
    setDetectedLanguage(fileInfo.language || 'english');
    
    // Only update step after other state is set
    setTimeout(() => {
      setCurrentStep(2);
      console.log('Index - Setting detected language:', fileInfo.language);
    }, 0);
  }, [setSelectedFile, setExtractedText, setChapters, setDetectedLanguage, setCurrentStep]);

  const goToNextStep = useCallback(() => {
    if (currentStep < conversionSteps.length) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, setCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep, setCurrentStep]);

  // Add initialization state logging
  useEffect(() => {
    console.log('Index component - Initialization state:', isInitialized);
  }, [isInitialized]);

  // Show loading spinner if not initialized
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

          <MainContent 
            currentStep={currentStep}
            selectedFile={selectedFile}
            extractedText={extractedText}
            chapters={chapters}
            detectedLanguage={detectedLanguage}
            onFileSelect={handleFileSelect}
            onNextStep={goToNextStep}
            onPreviousStep={goToPreviousStep}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
