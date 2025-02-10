
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { Chapter } from '@/utils/textExtraction';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';

export const useConversionLogic = (
  selectedFile: File | null,
  extractedText: string,
  chapters: Chapter[],
  onStepComplete?: () => void
) => {
  const [detectChapters, setDetectChapters] = useState(true);
  const [detectingChapters, setDetectingChapters] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    handleConversion,
    handleDownload,
    resetConversion,
    conversionId,
    setProgress,
    setConversionStatus
  } = useAudioConversion();

  // Request wake lock when conversion starts
  useEffect(() => {
    const requestWakeLock = async () => {
      if (conversionStatus === 'converting' && !wakeLock) {
        try {
          const wl = await navigator.wakeLock.request('screen');
          console.log('Wake Lock is active');
          setWakeLock(wl);
          
          // Handle wake lock release
          wl.addEventListener('release', () => {
            console.log('Wake Lock was released');
            setWakeLock(null);
          });
        } catch (err) {
          console.error('Error requesting wake lock:', err);
        }
      }
    };

    // Only try to get wake lock if the API is available
    if ('wakeLock' in navigator) {
      requestWakeLock();
    }

    // Release wake lock when conversion is done or on error
    return () => {
      if (wakeLock && (conversionStatus === 'completed' || conversionStatus === 'error')) {
        wakeLock.release()
          .then(() => console.log('Wake Lock released'))
          .catch((err) => console.error('Error releasing wake lock:', err));
      }
    };
  }, [conversionStatus, wakeLock]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && conversionStatus === 'converting' && !wakeLock) {
        try {
          const wl = await navigator.wakeLock.request('screen');
          setWakeLock(wl);
          console.log('Wake Lock reacquired');
        } catch (err) {
          console.error('Error reacquiring wake lock:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [conversionStatus, wakeLock]);

  useEffect(() => {
    if (selectedFile) {
      resetConversion();
      clearConversionStorage();
    }
  }, [selectedFile, resetConversion]);

  useEffect(() => {
    if (conversionStatus === 'completed' && onStepComplete) {
      onStepComplete();
    }
  }, [conversionStatus, onStepComplete]);

  const initiateConversion = () => {
    if (!selectedFile || !extractedText) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      });
      return;
    }
    
    resetConversion();
    clearConversionStorage();
    setShowTerms(true);
  };

  const handleAcceptTerms = async (selectedVoice: string) => {
    if (!selectedFile || !extractedText) return;
    setDetectingChapters(true);
    try {
      await handleConversion(extractedText, selectedVoice, detectChapters, chapters, selectedFile.name);
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion failed",
        description: error.message || "An error occurred during conversion",
        variant: "destructive",
      });
      resetConversion();
      clearConversionStorage();
    } finally {
      setDetectingChapters(false);
      setShowTerms(false);
    }
  };

  const handleDownloadClick = () => {
    if (selectedFile) {
      handleDownload(selectedFile.name);
    }
  };

  const handleViewConversions = () => {
    navigate('/conversions');
  };

  const calculateEstimatedSeconds = () => {
    if (!extractedText) return 0;
    const baseTimePerChar = 0.015;
    const overhead = 5;
    const chunkSize = 5000;
    const numberOfChunks = Math.ceil(extractedText.length / chunkSize);
    const chunkOverhead = numberOfChunks * 0.5;
    return Math.ceil((extractedText.length * baseTimePerChar) + overhead + chunkOverhead);
  };

  return {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    showTerms,
    setShowTerms,
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    initiateConversion,
    handleAcceptTerms,
    handleDownloadClick,
    handleViewConversions,
    calculateEstimatedSeconds,
    conversionId,
    setProgress,
    setConversionStatus
  };
};
