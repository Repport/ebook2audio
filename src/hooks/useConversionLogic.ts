
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { Chapter } from '@/utils/textExtraction';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { retryOperation } from '@/services/conversion/utils/retryUtils';
import { generateHash } from '@/services/conversion/utils';

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
    setConversionStatus,
    setConversionId
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

  const initiateConversion = useCallback(() => {
    if (!selectedFile || !extractedText) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      });
      return false;
    }
    
    const checkRecentTermsAcceptance = async () => {
      const { data, error } = await supabase
        .from('terms_acceptance_logs')
        .select('*')
        .order('accepted_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking terms acceptance:', error);
        setShowTerms(true);
        return;
      }

      if (!data || data.length === 0 || 
          new Date(data[0].accepted_at).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
        setShowTerms(true);
      } else {
        console.log('Recent terms acceptance found, proceeding with conversion');
        resetConversion();
        clearConversionStorage();
      }
    };

    checkRecentTermsAcceptance();
    return true;
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

    if (detectingChapters || conversionStatus === 'converting') {
      toast({
        title: "Please wait",
        description: "A conversion is already in progress.",
        variant: "default",
      });
      return;
    }

    setDetectingChapters(true);
    setConversionStatus('converting');

    try {
      const textHash = await generateHash(extractedText, options.selectedVoice);
      console.log('Generated text hash:', textHash);

      // Create initial conversion record
      const { data: conversionRecord, error: conversionError } = await supabase
        .from('text_conversions')
        .insert({
          file_name: selectedFile.name,
          status: 'processing',
          file_size: extractedText.length,
          progress: 0,
          user_id: user?.id,
          processed_characters: 0,
          total_characters: extractedText.length,
          total_chunks: Math.ceil(extractedText.length / 4800),
          text_hash: textHash,
          notify_on_complete: options.notifyOnComplete || false
        })
        .select()
        .single();

      if (conversionError || !conversionRecord) {
        throw new Error(conversionError?.message || 'Failed to create conversion record');
      }

      console.log('Created conversion record:', conversionRecord.id);
      setConversionId(conversionRecord.id);

      console.log('Starting conversion with options:', {
        textLength: extractedText.length,
        voice: options.selectedVoice,
        chapters: chapters.length,
        fileName: selectedFile.name
      });

      const result = await handleConversion(
        extractedText,
        options.selectedVoice,
        detectChapters,
        chapters,
        selectedFile.name,
        conversionRecord.id
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

  const handleViewConversions = useCallback(() => {
    navigate('/conversions');
  }, [navigate]);

  const calculateEstimatedSeconds = useCallback(() => {
    if (!extractedText) return 0;

    const wordsCount = extractedText.split(/\s+/).length;
    const averageWordsPerMinute = 150;
    const baseProcessingTime = 5;

    return Math.ceil((wordsCount / averageWordsPerMinute) * 60 + baseProcessingTime);
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
    calculateEstimatedSeconds,
    conversionId,
    setProgress,
    setConversionStatus,
    resetConversion
  };
};
