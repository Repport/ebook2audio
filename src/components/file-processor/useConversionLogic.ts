
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { Chapter } from '@/utils/textExtraction';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';
import { generateHash } from '@/services/conversion/utils';
import { supabase } from '@/integrations/supabase/client';
import { fetchFromCache } from '@/services/conversion/cacheService';

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
  const [detectChapters, setDetectChapters] = useState(true);
  const [detectingChapters, setDetectingChapters] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
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
    setConversionStatus,
    setAudioData,
    setAudioDuration,
    setCurrentFileName
  } = useAudioConversion();

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

  const checkExistingConversion = async (textHash: string) => {
    console.log('Checking for existing conversion with hash:', textHash);
    
    const { data: existingConversion, error } = await supabase
      .from('text_conversions')
      .select('*')
      .eq('text_hash', textHash)
      .eq('status', 'completed')
      .maybeSingle();

    if (error) {
      console.error('Error checking existing conversion:', error);
      return null;
    }

    if (existingConversion?.storage_path) {
      console.log('Found existing conversion:', existingConversion);
      const { data: audioBuffer, error: fetchError } = await fetchFromCache(existingConversion.storage_path);
      
      if (fetchError) {
        console.error('Error fetching cached audio:', fetchError);
        return null;
      }

      return {
        conversion: existingConversion,
        audioBuffer
      };
    }

    return null;
  };

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

  const handleAcceptTerms = async (options: ConversionOptions) => {
    if (!selectedFile || !extractedText) return;
    
    setDetectingChapters(true);
    try {
      // Generate hash and check for existing conversion
      const textHash = await generateHash(extractedText, options.selectedVoice);
      const existingConversion = await checkExistingConversion(textHash);

      if (existingConversion) {
        console.log('Using cached version');
        setProgress(100);
        setConversionStatus('completed');
        setAudioData(existingConversion.audioBuffer);
        setAudioDuration(existingConversion.conversion.duration || 0);
        setCurrentFileName(selectedFile.name);
        
        toast({
          title: "Using cached version",
          description: "This document has been converted before. Using the cached version to save time.",
        });
        return;
      }

      await handleConversion(extractedText, options.selectedVoice, detectChapters, chapters, selectedFile.name);
    } catch (error: any) {
      console.error('Conversion error:', error);
      
      // Check if it's an edge function error
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
    
    const wordsCount = extractedText.split(/\s+/).length;
    const avgWordsPerSecond = 2.5; // Adjusted based on actual conversion rates
    const chunkSize = 5000;
    const numberOfChunks = Math.ceil(extractedText.length / chunkSize);
    const chunkProcessingOverhead = 2; // 2 seconds per chunk overhead
    
    const baseTime = Math.ceil(wordsCount / avgWordsPerSecond);
    const totalOverhead = numberOfChunks * chunkProcessingOverhead;
    
    return baseTime + totalOverhead + 5; // Add 5 seconds for initial setup
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
