
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { Chapter } from '@/utils/textExtraction';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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

  const handleAcceptTerms = async (selectedVoice: string, notifyOnComplete: boolean = false) => {
    if (!selectedFile || !extractedText) return;
    setDetectingChapters(true);
    try {
      const result = await handleConversion(extractedText, selectedVoice, detectChapters, chapters, selectedFile.name);
      
      // Create notification if notification is enabled and user is authenticated
      if (notifyOnComplete && user && result.id) {
        const { error: notificationError } = await supabase
          .from('conversion_notifications')
          .insert({
            conversion_id: result.id,
            user_id: user.id,
            email: user.email,
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
          toast({
            title: "Notification Error",
            description: "Could not set up email notification",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Notification Set",
            description: "We'll email you when your conversion is ready!",
          });
        }
      }
      
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
    
    // More accurate calculation formula
    const wordsCount = extractedText.split(/\s+/).length;
    const averageWordsPerMinute = 150; // Average reading speed
    const minutes = wordsCount / averageWordsPerMinute;
    const processingOverhead = 2; // Base processing time in seconds
    
    return Math.ceil(minutes * 60 + processingOverhead);
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
