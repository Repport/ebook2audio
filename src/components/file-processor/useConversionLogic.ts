
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { Chapter } from '@/utils/textExtraction';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { retryOperation } from '@/services/conversion/utils/retryUtils';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

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

  // Log para depuración
  useEffect(() => {
    console.log('useConversionLogic - progress update:', {
      progress,
      status: conversionStatus,
      hasAudioData: !!audioData
    });
  }, [progress, conversionStatus, audioData]);

  // Optimizado para evitar reejecution innecesaria
  useEffect(() => {
    const shouldReset = selectedFile && 
      (conversionStatus !== 'idle' || audioData !== null);
    
    if (shouldReset) {
      resetConversion();
      clearConversionStorage();
    }
  }, [selectedFile]); // Removido resetConversion de las dependencias

  // Asegurarse de que onStepComplete se llame cuando la conversión se complete
  useEffect(() => {
    if (conversionStatus === 'completed' && onStepComplete) {
      console.log('Conversion completed, calling onStepComplete');
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
    
    // Verificar si hay una aceptación reciente de términos
    const checkRecentTermsAcceptance = async () => {
      try {
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

        // Si no hay registros o el último registro es de hace más de 24 horas
        if (!data || data.length === 0 || 
            new Date(data[0].accepted_at).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
          setShowTerms(true);
        } else {
          // Términos aceptados recientemente, proceder con la conversión
          resetConversion();
          clearConversionStorage();
        }
      } catch (err) {
        console.error('Error in terms acceptance check:', err);
        setShowTerms(true);
      }
    };

    checkRecentTermsAcceptance();
    return true;
  }, [selectedFile, extractedText, toast, resetConversion]);

  // Actualiza el progreso basado en los datos de chunk
  const handleProgressUpdate = useCallback((data: ChunkProgressData) => {
    console.log('Progress update received in useConversionLogic:', data);
    
    // Verificar si es un mensaje de completado
    if (data.isCompleted) {
      console.log('Conversion completed via progress update');
      setProgress(100);
      setConversionStatus('completed');
      return;
    }
    
    if (data.processedCharacters && data.totalCharacters) {
      const newProgress = Math.round((data.processedCharacters / data.totalCharacters) * 100);
      console.log(`Setting progress to ${newProgress}%`);
      setProgress(newProgress);
      
      // Si el progreso es 100%, verificar si debemos cambiar el estado
      if (newProgress >= 100) {
        console.log('Progress reached 100%, verifying if conversion is complete');
        
        // Dar un pequeño margen de tiempo para procesar el último chunk
        setTimeout(() => {
          if (conversionStatus !== 'completed') {
            console.log('Setting status to completed after timeout');
            setConversionStatus('completed');
          }
        }, 1000);
      }
    } else if (typeof data.progress === 'number') {
      console.log(`Setting direct progress: ${data.progress}%`);
      setProgress(data.progress);
      
      // Verificar también aquí si alcanzamos el 100%
      if (data.progress >= 100) {
        console.log('Direct progress reached 100%, verifying if conversion is complete');
        
        // Pequeño tiempo de gracia
        setTimeout(() => {
          if (conversionStatus !== 'completed') {
            console.log('Setting status to completed after direct progress timeout');
            setConversionStatus('completed');
          }
        }, 1000);
      }
    }
  }, [setProgress, setConversionStatus, conversionStatus]);

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
    setConversionStatus('converting'); // Evitar conversiones duplicadas
    setProgress(0); // Asegurarnos de empezar desde 0
    
    try {
      console.log('Starting conversion with text length:', extractedText.length);
      const result = await handleConversion(
        extractedText,
        options.selectedVoice,
        detectChapters,
        chapters,
        selectedFile.name,
        handleProgressUpdate  // Pasar el callback de progreso
      );
      
      if (!result) {
        throw new Error('La conversión falló o fue cancelada');
      }
      
      console.log('Conversion result received:', result);
      
      // Asegurarse de que el estado se actualice a completado
      setConversionStatus('completed');
      setProgress(100);
      
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
      
      console.log('Conversion completed successfully');
      
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

  const estimatedSeconds = useMemo(() => {
    if (!extractedText) return 0;

    const wordsCount = extractedText.split(/\s+/).length;
    const averageWordsPerMinute = 150;
    const baseProcessingTime = 5; // Tiempo mínimo en segundos
    
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
    calculateEstimatedSeconds: () => estimatedSeconds,
    conversionId,
    setProgress,
    setConversionStatus
  };
};
