import { useEffect } from 'react';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { Chapter } from '@/utils/textExtraction';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';
import { generateHash } from '@/services/conversion/utils';
import { checkExistingConversion } from '@/services/conversion/cacheCheckService';
import { calculateEstimatedTime, updatePerformanceMetrics } from '@/services/conversion/estimationService';
import { useConversionState } from '@/hooks/useConversionState';

export interface ConversionOptions {
  selectedVoice: string;
  notifyOnComplete?: boolean;
}

export const useConversionLogic = (
  selectedFile: File | null,
  extractedText: string,
  chapters: Chapter[],
  onStepComplete?: () => void
) => {
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
    setConversionStatus,
    setAudioData,
    setAudioDuration,
    setCurrentFileName
  } = useAudioConversion();

  const {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    setDetectingChapters,
    showTerms,
    setShowTerms,
    initiateConversion,
    handleViewConversions,
    toast
  } = useConversionState();

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

  const handleAcceptTerms = async (options: ConversionOptions) => {
    if (!selectedFile || !extractedText) return;
    
    setDetectingChapters(true);
    const startTime = performance.now();
    
    try {
      const textHash = await generateHash(extractedText, options.selectedVoice);
      const existingConversion = await checkExistingConversion(textHash);

      if (existingConversion) {
        console.log('Using cached version');
        setProgress(100);
        setConversionStatus('completed');
        setAudioData(existingConversion.audioBuffer);
        setAudioDuration(existingConversion.conversion.duration || 0);
        setCurrentFileName(selectedFile.name);
        return;
      }

      const result = await handleConversion(extractedText, options.selectedVoice, detectChapters, chapters, selectedFile.name);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      if (result && extractedText) {
        updatePerformanceMetrics(extractedText.length, executionTime);
      }
      
    } catch (error: any) {
      console.error('Conversion error:', error);
      
      if (error.message?.includes('Failed to fetch') || error.error_type === 'http_server_error') {
        toast({
          title: "Connection Error",
          description: "Failed to connect to the conversion service. Please try again in a few moments.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conversion failed",
          description: error.message || "An error occurred during conversion",
          variant: "destructive",
        });
      }
      
      resetConversion();
      clearConversionStorage();
    } finally {
      setDetectingChapters(false);
      setShowTerms(false);
    }
  };

  const startConversion = () => {
    if (initiateConversion(selectedFile, extractedText)) {
      resetConversion();
      clearConversionStorage();
      setShowTerms(true);
    }
  };

  const handleDownloadClick = () => {
    if (selectedFile) {
      handleDownload(selectedFile.name);
    }
  };

  const calculateEstimatedSeconds = () => {
    if (!extractedText) return 0;
    
    // Check if we have a cached version by looking at conversionStatus
    const isCached = conversionStatus === 'completed';
    return calculateEstimatedTime(extractedText, isCached);
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
    initiateConversion: startConversion,
    handleAcceptTerms,
    handleDownloadClick,
    handleViewConversions,
    calculateEstimatedSeconds,
    conversionId,
    setProgress,
    setConversionStatus
  };
};
