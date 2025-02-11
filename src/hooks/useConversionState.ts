
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Chapter } from '@/utils/textExtraction';

interface ConversionState {
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  audioData: ArrayBuffer | null;
  audioDuration: number;
  currentFileName: string | null;
  conversionId: string | null;
}

export const useConversionState = () => {
  const [detectChapters, setDetectChapters] = useState(true);
  const [detectingChapters, setDetectingChapters] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Audio conversion state
  const [conversionStatus, setConversionStatus] = useState<ConversionState['conversionStatus']>('idle');
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [conversionId, setConversionId] = useState<string | null>(null);

  const initiateConversion = (selectedFile: File | null, extractedText: string) => {
    if (!selectedFile || !extractedText) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleViewConversions = () => {
    navigate('/conversions');
  };

  return {
    // Basic conversion state
    detectChapters,
    setDetectChapters,
    detectingChapters,
    setDetectingChapters,
    showTerms,
    setShowTerms,
    initiateConversion,
    handleViewConversions,
    toast,
    
    // Audio conversion state
    conversionStatus,
    setConversionStatus,
    progress,
    setProgress,
    audioData,
    setAudioData,
    audioDuration,
    setAudioDuration,
    currentFileName,
    setCurrentFileName,
    conversionId,
    setConversionId
  };
};
