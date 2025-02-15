
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { Chapter } from '@/utils/textExtraction';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { retryOperation } from '@/services/conversion/utils/retryUtils';

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
  const { user } = useAuth();

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

  const initiateConversion = useCallback(() => {
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
  }, [selectedFile, extractedText, toast, resetConversion]);

  const handleAcceptTerms = async (options: ConversionOptions) => {
    if (!selectedFile || !extractedText || !options.selectedVoice) {
      console.error('Missing required parameters:', {
        hasFile: !!selectedFile,
        hasText: !!extractedText,
        hasVoice: !!options.selectedVoice
      });
      toast({
        title: "Error",
        description: "Missing required parameters. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (detectingChapters) {
      toast({
        title: "Please wait",
        description: "Still detecting chapters. Please wait a moment.",
        variant: "default",
      });
      return;
    }

    setDetectingChapters(true);
    try {
      const result = await handleConversion(
        extractedText,
        options.selectedVoice,
        detectChapters,
        chapters,
        selectedFile.name
      );
      
      // Create notification if notification is enabled and user is authenticated
      if (options.notifyOnComplete && user && result.id) {
        const notificationResult = await retryOperation(async () => {
          return supabase.from('conversion_notifications').insert({
            conversion_id: result.id,
            user_id: user.id,
            email: user.email,
          });
        }, { maxRetries: 3 });

        if (notificationResult.error) {
          console.error('Error creating notification:', notificationResult.error);
          toast({
            title: "Notification Error",
            description: "Could not set up email notification. Please try again later.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Notification Set",
            description: "You'll receive an email when your conversion is ready!",
          });
        }
      }
      
    } catch (error: any) {
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
    }
  };

  const handleDownloadClick = useCallback(() => {
    if (!audioData || !selectedFile) {
      toast({
        title: "Download Failed",
        description: "No audio file available for download.",
        variant: "destructive",
      });
      return;
    }

    handleDownload(selectedFile.name);
  }, [audioData, selectedFile, toast, handleDownload]);

  const handleViewConversions = useCallback(() => {
    navigate('/conversions');
  }, [navigate]);

  const estimatedSeconds = useMemo(() => {
    if (!extractedText) return 0;

    const wordsCount = extractedText.split(/\s+/).length;
    const averageWordsPerMinute = 150;
    const processingOverhead = Math.max(2, Math.log(wordsCount) * 5);

    return Math.ceil((wordsCount / averageWordsPerMinute) * 60 + processingOverhead);
  }, [extractedText]);

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
    calculateEstimatedSeconds: () => estimatedSeconds,
    conversionId,
    setProgress,
    setConversionStatus
  };
};
