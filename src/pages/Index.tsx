
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StepsProgressBar from '@/components/steps/StepsProgressBar';
import MainContent from '@/components/home/MainContent';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { conversionSteps } from '@/constants/steps';
import { Chapter } from '@/utils/textExtraction';

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
    setDetectedLanguage
  } = useSessionStorage();

  const handleFileSelect = async (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => {
    if (!fileInfo) {
      setSelectedFile(null);
      setExtractedText('');
      setChapters([]);
      setDetectedLanguage('english');
      setCurrentStep(1);
      return;
    }

    setSelectedFile(fileInfo.file);
    setExtractedText(fileInfo.text);
    setChapters(fileInfo.chapters || []);
    setDetectedLanguage(fileInfo.language || 'english');
    setCurrentStep(2);
    console.log('Index - Setting detected language:', fileInfo.language);
  };

  const goToNextStep = () => {
    if (currentStep < conversionSteps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

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
