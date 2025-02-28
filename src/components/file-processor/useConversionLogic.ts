
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
    elapsedTime,
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
      hasAudioData: !!audioData,
      elapsedTime,
      detectingChapters
    });
  }, [progress, conversionStatus, audioData, elapsedTime, detectingChapters]);

  // Efecto para manejar errores de detección de capítulos
  useEffect(() => {
    const maxDetectionTime = 10000; // 10 segundos
    let timeout: NodeJS.Timeout | null = null;
    
    if (detectingChapters) {
      console.log('useConversionLogic - Starting chapter detection timeout check');
      timeout = setTimeout(() => {
        console.log('useConversionLogic - Chapter detection timeout reached');
        if (detectingChapters) {
          console.log('useConversionLogic - Forcing chapter detection to complete');
          setDetectingChapters(false);
          toast({
            title: "Chapter detection timed out",
            description: "We couldn't complete chapter detection, but you can continue with the conversion.",
            variant: "default",
          });
        }
      }, maxDetectionTime);
    }
    
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [detectingChapters, toast]);

  // Optimizado para evitar reejecution innecesaria
  useEffect(() => {
    const shouldReset = selectedFile && 
      (conversionStatus !== 'idle' || audioData !== null);
    
    if (shouldReset) {
      console.log('useConversionLogic - Resetting conversion state due to file change');
      resetConversion();
      clearConversionStorage();
    }
  }, [selectedFile, conversionStatus, audioData, resetConversion]); 

  // Asegurarse de que onStepComplete se llame cuando la conversión se complete
  useEffect(() => {
    if (conversionStatus === 'completed' && onStepComplete) {
      console.log('useConversionLogic - Conversion completed, calling onStepComplete');
      onStepComplete();
    }
  }, [conversionStatus, onStepComplete]);

  // Resetear detectingChapters si hay un error
  useEffect(() => {
    if (conversionStatus === 'error' && detectingChapters) {
      console.log('useConversionLogic - Error detected, resetting chapter detection');
      setDetectingChapters(false);
    }
  }, [conversionStatus, detectingChapters]);

  const initiateConversion = useCallback(() => {
    console.log('useConversionLogic - initiateConversion called');
    
    if (!selectedFile || !extractedText) {
      console.log('useConversionLogic - Missing file or text');
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
        console.log('useConversionLogic - Checking terms acceptance');
        const { data, error } = await supabase
          .from('terms_acceptance_logs')
          .select('*')
          .order('accepted_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('useConversionLogic - Error checking terms acceptance:', error);
          setShowTerms(true);
          return;
        }

        // Si no hay registros o el último registro es de hace más de 24 horas
        if (!data || data.length === 0 || 
            new Date(data[0].accepted_at).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
          console.log('useConversionLogic - Need to show terms');
          setShowTerms(true);
        } else {
          // Términos aceptados recientemente, proceder con la conversión
          console.log('useConversionLogic - Terms already accepted');
          resetConversion();
          clearConversionStorage();
        }
      } catch (err) {
        console.error('useConversionLogic - Error in terms acceptance check:', err);
        setShowTerms(true);
      }
    };

    checkRecentTermsAcceptance();
    return true;
  }, [selectedFile, extractedText, toast, resetConversion]);

  // Actualiza el progreso basado en los datos de chunk
  const handleProgressUpdate = useCallback((data: ChunkProgressData) => {
    console.log('useConversionLogic - Progress update received:', data);
    
    // Si hay un error, mostrarlo pero continuar
    if (data.error) {
      console.warn('useConversionLogic - Error processing chunk:', data.error);
      toast({
        title: "Warning",
        description: `Error processing chunk: ${data.error}. Conversion will continue.`,
        variant: "warning",
      });
    }
    
    // Verificar si es un mensaje de completado
    if (data.isCompleted) {
      console.log('useConversionLogic - Conversion completed via progress update');
      setProgress(100);
      setConversionStatus('completed');
      return;
    }
    
    if (data.processedCharacters && data.totalCharacters) {
      const newProgress = Math.round((data.processedCharacters / data.totalCharacters) * 100);
      console.log(`useConversionLogic - Setting progress to ${newProgress}%`);
      setProgress(newProgress);
      
      // Si el progreso es 100%, verificar si debemos cambiar el estado
      if (newProgress >= 100) {
        console.log('useConversionLogic - Progress reached 100%, setting to completed');
        
        // Dar un pequeño margen de tiempo para procesar el último chunk
        setTimeout(() => {
          if (conversionStatus !== 'completed') {
            console.log('useConversionLogic - Setting status to completed after timeout');
            setConversionStatus('completed');
          }
        }, 1000);
      }
    } else if (typeof data.progress === 'number') {
      console.log(`useConversionLogic - Setting direct progress: ${data.progress}%`);
      setProgress(data.progress);
      
      // Verificar también aquí si alcanzamos el 100%
      if (data.progress >= 100) {
        console.log('useConversionLogic - Direct progress reached 100%');
        
        // Pequeño tiempo de gracia
        setTimeout(() => {
          if (conversionStatus !== 'completed') {
            console.log('useConversionLogic - Setting status to completed after direct progress timeout');
            setConversionStatus('completed');
          }
        }, 1000);
      }
    }
  }, [setProgress, setConversionStatus, conversionStatus, toast]);

  const handleAcceptTerms = async (options: ConversionOptions) => {
    console.log('useConversionLogic - handleAcceptTerms called with options:', options);
    
    if (!selectedFile || !extractedText || !options.selectedVoice) {
      console.error('useConversionLogic - Missing required parameters:', {
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
      console.log('useConversionLogic - Already in progress, cannot start again');
      toast({
        title: "Please wait",
        description: "A conversion is already in progress.",
        variant: "default",
      });
      return;
    }

    // Asegurarse de que no estamos en un estado de detección de capítulos
    setDetectingChapters(false);
    setConversionStatus('converting'); // Evitar conversiones duplicadas
    setProgress(0); // Asegurarnos de empezar desde 0
    
    try {
      console.log('useConversionLogic - Starting conversion with text length:', extractedText.length);
      const result = await handleConversion(
        extractedText,
        options.selectedVoice,
        detectChapters,
        chapters,
        selectedFile.name,
        handleProgressUpdate  // Pasar el callback de progreso
      );
      
      if (!result) {
        console.error('useConversionLogic - Conversion failed or was cancelled');
        throw new Error('La conversión falló o fue cancelada');
      }
      
      console.log('useConversionLogic - Conversion result received:', result);
      
      // Asegurarse de que el estado se actualice a completado
      setConversionStatus('completed');
      setProgress(100);
      
      // Create notification if notification is enabled and user is authenticated
      if (options.notifyOnComplete && user && result.id) {
        console.log('useConversionLogic - Setting up notification for conversion completion');
        const notificationResult = await retryOperation(async () => {
          return supabase.from('conversion_notifications').insert({
            conversion_id: result.id,
            user_id: user.id,
            email: user.email,
          });
        }, { maxRetries: 3 });

        if (notificationResult.error) {
          console.error('useConversionLogic - Error creating notification:', notificationResult.error);
          toast({
            title: "Notification Error",
            description: "Could not set up email notification. Please try again later.",
            variant: "destructive",
          });
        } else {
          console.log('useConversionLogic - Notification set successfully');
          toast({
            title: "Notification Set",
            description: "You'll receive an email when your conversion is ready!",
          });
        }
      }
      
      console.log('useConversionLogic - Conversion completed successfully');
      
    } catch (error: any) {
      console.error('useConversionLogic - Conversion error:', error);
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
    console.log('useConversionLogic - handleDownloadClick called');
    
    if (!audioData) {
      console.log('useConversionLogic - No audio data available for download');
      toast({
        title: "Download Unavailable",
        description: "The audio file is not ready yet. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      console.log('useConversionLogic - Missing file name for download');
      toast({
        title: "Missing File Name",
        description: "Could not determine the file name. Using default.",
        variant: "default",
      });
    }

    console.log('useConversionLogic - Starting download');
    handleDownload(selectedFile?.name || "converted_audio");
  }, [audioData, selectedFile, toast, handleDownload]);

  const handleViewConversions = useCallback(() => {
    console.log('useConversionLogic - Navigating to conversions page');
    navigate('/conversions');
  }, [navigate]);

  const estimatedSeconds = useMemo(() => {
    if (!extractedText) return 0;

    const wordsCount = extractedText.split(/\s+/).length;
    const averageWordsPerMinute = 150;
    const baseProcessingTime = 5; // Tiempo mínimo en segundos
    
    const estimation = Math.ceil((wordsCount / averageWordsPerMinute) * 60 + baseProcessingTime);
    console.log('useConversionLogic - Estimated conversion time:', estimation, 'seconds');
    return estimation;
  }, [extractedText]);

  return {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    setDetectingChapters,  // Exportar esta función para permitir cancelación manual
    showTerms,
    setShowTerms,
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    elapsedTime,
    initiateConversion,
    handleAcceptTerms,
    handleDownloadClick,
    handleViewConversions,
    calculateEstimatedSeconds: () => estimatedSeconds,
    conversionId,
    setProgress,
    setConversionStatus,
    resetConversion
  };
};
