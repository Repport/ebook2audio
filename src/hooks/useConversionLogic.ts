
import { useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { Chapter } from '@/utils/textExtraction';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { retryOperation } from '@/services/conversion/utils/retryUtils';
import { useChaptersDetection } from './conversion/useChaptersDetection';
import { useTermsAcceptance } from './conversion/useTermsAcceptance';
import { useEstimatedTime } from './conversion/useEstimatedTime';
import { useNavigationHandlers } from './conversion/useNavigationHandlers';

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
  const { toast } = useToast();
  const { user } = useAuth();
  const { showTerms, setShowTerms, checkRecentTermsAcceptance } = useTermsAcceptance();
  const { detectChapters, setDetectChapters, detectingChapters, setDetectingChapters } = useChaptersDetection();
  const { calculateEstimatedSeconds } = useEstimatedTime(extractedText);
  const { handleViewConversions } = useNavigationHandlers();

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
    const shouldReset = selectedFile && 
      (conversionStatus !== 'idle' || audioData !== null);
    
    if (shouldReset) {
      resetConversion();
      clearConversionStorage();
    }
  }, [selectedFile, conversionStatus, audioData, resetConversion]);

  useEffect(() => {
    if (conversionStatus === 'completed' && onStepComplete) {
      onStepComplete();
    }
  }, [conversionStatus, onStepComplete]);

  const initiateConversion = useCallback(async () => {
    if (!selectedFile || !extractedText) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      });
      return false;
    }

    // Verificar términos y condiciones
    const termsAccepted = await checkRecentTermsAcceptance();
    
    if (!termsAccepted) {
      setShowTerms(true);
      return false;
    }
    
    return true;
  }, [selectedFile, extractedText, toast, checkRecentTermsAcceptance, setShowTerms]);

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

    if (detectingChapters || conversionStatus === 'converting') {
      toast({
        title: "Please wait",
        description: "A conversion is already in progress.",
        variant: "default",
      });
      return;
    }

    // Verificar nuevamente los términos antes de proceder
    const termsAccepted = await checkRecentTermsAcceptance();
    if (!termsAccepted) {
      setShowTerms(true);
      return;
    }

    setDetectingChapters(true);
    setConversionStatus('converting');
    
    try {
      const result = await handleConversion(
        extractedText,
        options.selectedVoice,
        detectChapters,
        chapters,
        selectedFile.name
      );
      
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
    if (!audioData) {
      toast({
        title: "Download Unavailable",
        description: "The audio file is not ready yet. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Missing File Name",
        description: "Could not determine the file name. Using default.",
        variant: "default",
      });
    }

    handleDownload(selectedFile?.name || "converted_audio");
  }, [audioData, selectedFile, toast, handleDownload]);

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
