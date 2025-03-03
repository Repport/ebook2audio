
import { useState, useEffect, useCallback } from 'react';
import { Chapter } from '@/utils/textExtraction';
import { useToast } from './use-toast';

export const useSessionStorage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('english');
  const [conversionInProgress, setConversionInProgress] = useState<boolean>(false);
  const { toast } = useToast();

  // Load saved state from sessionStorage
  useEffect(() => {
    try {
      const savedStep = sessionStorage.getItem('currentStep');
      const savedText = sessionStorage.getItem('extractedText');
      const savedChapters = sessionStorage.getItem('chapters');
      const savedLanguage = sessionStorage.getItem('detectedLanguage');
      const savedFileName = sessionStorage.getItem('fileName');
      const savedFileType = sessionStorage.getItem('fileType');
      const savedFileLastModified = sessionStorage.getItem('fileLastModified');
      const savedFileSize = sessionStorage.getItem('fileSize');
      const savedConversionInProgress = sessionStorage.getItem('conversionInProgress');

      // First check if we had a conversion in progress
      if (savedConversionInProgress === 'true') {
        setConversionInProgress(true);
        
        // Show recovery toast
        toast({
          title: "Conversion Recovery",
          description: "Recovering from previous conversion state",
          variant: "default",
          duration: 5000,
        });
      }

      if (savedStep && savedText && savedFileName) {
        setCurrentStep(parseInt(savedStep));
        setExtractedText(savedText);
        if (savedChapters) {
          try {
            setChapters(JSON.parse(savedChapters));
          } catch (err) {
            console.error('Error parsing saved chapters:', err);
          }
        }
        setDetectedLanguage(savedLanguage || 'english');

        if (savedFileType && savedFileLastModified && savedFileSize) {
          try {
            const file = new File(
              [new Blob([])],
              savedFileName,
              {
                type: savedFileType,
                lastModified: parseInt(savedFileLastModified),
              }
            );
            setSelectedFile(file);
          } catch (err) {
            console.error('Error creating file from saved data:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error loading from sessionStorage:', err);
    }
  }, [toast]);

  // Save state to sessionStorage when it changes
  useEffect(() => {
    if (currentStep > 1 && selectedFile) {
      try {
        sessionStorage.setItem('currentStep', currentStep.toString());
        sessionStorage.setItem('extractedText', extractedText);
        sessionStorage.setItem('chapters', JSON.stringify(chapters));
        sessionStorage.setItem('detectedLanguage', detectedLanguage);
        sessionStorage.setItem('fileName', selectedFile.name);
        sessionStorage.setItem('fileType', selectedFile.type);
        sessionStorage.setItem('fileLastModified', selectedFile.lastModified.toString());
        sessionStorage.setItem('fileSize', selectedFile.size.toString());
        sessionStorage.setItem('conversionInProgress', conversionInProgress.toString());
      } catch (err) {
        console.error('Error saving to sessionStorage:', err);
      }
    } else {
      clearSessionStorageData();
    }
  }, [currentStep, selectedFile, extractedText, chapters, detectedLanguage, conversionInProgress]);

  // Clear session storage data
  const clearSessionStorageData = useCallback(() => {
    try {
      sessionStorage.removeItem('currentStep');
      sessionStorage.removeItem('extractedText');
      sessionStorage.removeItem('chapters');
      sessionStorage.removeItem('detectedLanguage');
      sessionStorage.removeItem('fileName');
      sessionStorage.removeItem('fileType');
      sessionStorage.removeItem('fileLastModified');
      sessionStorage.removeItem('fileSize');
      sessionStorage.removeItem('conversionInProgress');
    } catch (err) {
      console.error('Error clearing sessionStorage:', err);
    }
  }, []);

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
    conversionInProgress,
    setConversionInProgress,
    clearSessionStorageData
  };
};
