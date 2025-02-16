import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  loadConversionState, 
  saveConversionState, 
  convertArrayBufferToBase64, 
  convertBase64ToArrayBuffer 
} from '@/services/storage/conversionStorageService';

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

  const [conversionStatus, setConversionStatus] = useState<ConversionState['conversionStatus']>('idle');
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [conversionId, setConversionId] = useState<string | null>(null);

  useEffect(() => {
    const loadState = async () => {
      const savedState = await loadConversionState();
      if (savedState) {
        setConversionStatus(savedState.status);
        setProgress(savedState.progress);
        setCurrentFileName(savedState.fileName || null);
        setConversionId(savedState.conversionId || null);
        if (savedState.audioData) {
          const arrayBuffer = convertBase64ToArrayBuffer(savedState.audioData);
          setAudioData(arrayBuffer);
        }
        setAudioDuration(savedState.audioDuration);
      }
    };

    loadState();
  }, []);

  useEffect(() => {
    const saveState = async () => {
      if (conversionStatus !== 'idle') {
        const state = {
          status: conversionStatus,
          progress,
          audioData: audioData ? convertArrayBufferToBase64(audioData) : undefined,
          audioDuration,
          fileName: currentFileName || undefined,
          conversionId: conversionId || undefined,
        };
        await saveConversionState(state);
      }
    };

    saveState();
  }, [conversionStatus, progress, audioData, audioDuration, currentFileName, conversionId]);

  const initiateConversion = (selectedFile: File | null, extractedText: string) => {
    if (!selectedFile || !extractedText) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      });
      return false;
    }
    setConversionStatus('converting');
    return true;
  };

  const handleViewConversions = () => {
    navigate('/conversions');
  };

  return {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    setDetectingChapters,
    showTerms,
    setShowTerms,
    initiateConversion,
    handleViewConversions,
    toast,
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
