
import { useState, useEffect } from 'react';
import { Chapter } from '@/utils/textExtraction';

export const useSessionStorage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('english');

  // Load saved state from sessionStorage
  useEffect(() => {
    const savedStep = sessionStorage.getItem('currentStep');
    const savedText = sessionStorage.getItem('extractedText');
    const savedChapters = sessionStorage.getItem('chapters');
    const savedLanguage = sessionStorage.getItem('detectedLanguage');
    const savedFileName = sessionStorage.getItem('fileName');
    const savedFileType = sessionStorage.getItem('fileType');
    const savedFileLastModified = sessionStorage.getItem('fileLastModified');
    const savedFileSize = sessionStorage.getItem('fileSize');

    if (savedStep && savedText && savedFileName) {
      setCurrentStep(parseInt(savedStep));
      setExtractedText(savedText);
      if (savedChapters) {
        setChapters(JSON.parse(savedChapters));
      }
      setDetectedLanguage(savedLanguage || 'english');

      if (savedFileType && savedFileLastModified && savedFileSize) {
        const file = new File(
          [new Blob([])],
          savedFileName,
          {
            type: savedFileType,
            lastModified: parseInt(savedFileLastModified),
          }
        );
        setSelectedFile(file);
      }
    }
  }, []);

  // Save state to sessionStorage when it changes
  useEffect(() => {
    if (currentStep > 1 && selectedFile) {
      sessionStorage.setItem('currentStep', currentStep.toString());
      sessionStorage.setItem('extractedText', extractedText);
      sessionStorage.setItem('chapters', JSON.stringify(chapters));
      sessionStorage.setItem('detectedLanguage', detectedLanguage);
      sessionStorage.setItem('fileName', selectedFile.name);
      sessionStorage.setItem('fileType', selectedFile.type);
      sessionStorage.setItem('fileLastModified', selectedFile.lastModified.toString());
      sessionStorage.setItem('fileSize', selectedFile.size.toString());
    } else {
      sessionStorage.removeItem('currentStep');
      sessionStorage.removeItem('extractedText');
      sessionStorage.removeItem('chapters');
      sessionStorage.removeItem('detectedLanguage');
      sessionStorage.removeItem('fileName');
      sessionStorage.removeItem('fileType');
      sessionStorage.removeItem('fileLastModified');
      sessionStorage.removeItem('fileSize');
    }
  }, [currentStep, selectedFile, extractedText, chapters, detectedLanguage]);

  return {
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
  };
};
