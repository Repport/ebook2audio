import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { Chapter } from '@/utils/textExtraction';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';
import { supabase } from "@/integrations/supabase/client";

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
    setConversionStatus
  } = useAudioConversion();

  // Subscribe to real-time updates when conversion starts
  useEffect(() => {
    if (!conversionId) return;

    console.log('Setting up realtime listeners for conversion:', conversionId);

    // Listen for conversion status updates
    const conversionsChannel = supabase.channel('conversions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'text_conversions',
          filter: `id=eq.${conversionId}`
        },
        (payload) => {
          console.log('Conversion update received:', payload.new);
          const { status, progress: newProgress } = payload.new;
          
          if (status) {
            setConversionStatus(status as 'idle' | 'converting' | 'completed' | 'error');
          }
          
          if (typeof newProgress === 'number') {
            setProgress(Math.min(newProgress, 100));
          }

          if (status === 'completed' && onStepComplete) {
            onStepComplete();
          }

          if (status === 'error') {
            toast({
              title: "Conversion Error",
              description: payload.new.error_message || "An error occurred during conversion",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up realtime listeners');
      supabase.removeChannel(conversionsChannel);
    };
  }, [conversionId, setConversionStatus, setProgress, onStepComplete, toast]);

  useEffect(() => {
    if (selectedFile) {
      // Clear any stale conversion state when file changes
      resetConversion();
      clearConversionStorage();
    }
  }, [selectedFile, resetConversion]);

  useEffect(() => {
    if (conversionStatus === 'completed' && onStepComplete) {
      onStepComplete();
    }
  }, [conversionStatus, onStepComplete]);

  // Add timeout for stuck conversions
  useEffect(() => {
    let timeoutId: number;
    
    if (conversionStatus === 'converting' && progress === 100) {
      timeoutId = window.setTimeout(() => {
        resetConversion();
        clearConversionStorage();
        toast({
          title: "Conversion timed out",
          description: "Please try again",
          variant: "destructive",
        });
      }, 60000); // Reset after 1 minute of being stuck
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [conversionStatus, progress, resetConversion, toast]);

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
    calculateEstimatedSeconds
  };
};
