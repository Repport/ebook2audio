
import { useState } from 'react';
import { Chapter } from '@/utils/textExtraction';

/**
 * Hook providing session storage state
 */
export const useSessionState = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('english');
  const [conversionInProgress, setConversionInProgress] = useState<boolean>(false);

  return {
    // State
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
    conversionInProgress,
    setConversionInProgress,
  };
};
