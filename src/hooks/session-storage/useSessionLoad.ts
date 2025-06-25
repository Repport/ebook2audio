
import { useEffect } from 'react';
import { Chapter } from '@/utils/textExtraction';

interface SessionLoadProps {
  setSelectedFile: (file: File | null) => void;
  setExtractedText: (text: string) => void;
  setChapters: (chapters: Chapter[]) => void;
  setCurrentStep: (step: number) => void;
  setDetectedLanguage: (language: string) => void;
  setConversionInProgress: (inProgress: boolean) => void;
  setIsInitialized: (initialized: boolean) => void;
}

export const useSessionLoad = (props: SessionLoadProps) => {
  const {
    setSelectedFile,
    setExtractedText,
    setChapters,
    setCurrentStep,
    setDetectedLanguage,
    setConversionInProgress,
    setIsInitialized
  } = props;

  useEffect(() => {
    const loadSessionData = () => {
      try {
        // Load basic session data
        const step = sessionStorage.getItem('currentStep');
        if (step) {
          setCurrentStep(parseInt(step, 10));
        }

        const text = sessionStorage.getItem('extractedText');
        if (text) {
          setExtractedText(text);
        }

        const language = sessionStorage.getItem('detectedLanguage');
        if (language) {
          setDetectedLanguage(language);
        }

        const inProgress = sessionStorage.getItem('conversionInProgress');
        if (inProgress === 'true') {
          setConversionInProgress(true);
        }

        // Load chapters
        const chaptersData = sessionStorage.getItem('chapters');
        if (chaptersData) {
          const parsedChapters = JSON.parse(chaptersData);
          // Ensure chapters have required properties
          const validChapters = parsedChapters.map((chapter: any) => ({
            id: chapter.id || '',
            title: chapter.title || '',
            startTime: chapter.startTime || 0,
            endTime: chapter.endTime || 0,
            startIndex: chapter.startIndex || 0, // Add required startIndex
            timestamp: chapter.timestamp,
            metadata: chapter.metadata,
            confidence: chapter.confidence,
            type: chapter.type,
            content: chapter.content
          }));
          setChapters(validChapters);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading session data:', error);
        setIsInitialized(true);
      }
    };

    loadSessionData();
  }, [
    setSelectedFile,
    setExtractedText,
    setChapters,
    setCurrentStep,
    setDetectedLanguage,
    setConversionInProgress,
    setIsInitialized
  ]);
};
