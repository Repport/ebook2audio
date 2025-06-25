
import { Chapter } from '@/utils/textExtraction';
import { useSessionState } from './session-storage/useSessionState';
import { useSessionLoad } from './session-storage/useSessionLoad';
import { useSessionSave } from './session-storage/useSessionSave';

export interface UseSessionStorageReturn {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  extractedText: string;  
  setExtractedText: (text: string) => void;
  chapters: Chapter[];
  setChapters: (chapters: Chapter[]) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  detectedLanguage: string;
  setDetectedLanguage: (language: string) => void;
  conversionInProgress: boolean;
  setConversionInProgress: (inProgress: boolean) => void;
  isInitialized: boolean;
}

export const useSessionStorage = (): UseSessionStorageReturn => {
  const sessionState = useSessionState();
  
  // Load session data on mount
  useSessionLoad(sessionState);
  
  // Save session data when state changes
  useSessionSave(sessionState);

  return {
    ...sessionState
  };
};
