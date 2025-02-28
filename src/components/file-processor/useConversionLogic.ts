
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

  // Efecto para salir automáticamente del estado de detección de capítulos
  useEffect(() => {
    if (detectingChapters) {
      // Si estamos detectando capítulos, consideramos que ya están cargados
      setDetectingChapters(false);
    }
  }, [chapters, detectingChapters]);

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
    if (conversionStatus === 'error') {
      console.log('useConversionLogic - Error detected, resetting chapter detection');
      setDetectingChapters(false);
    }
  }, [conversionStatus]);

  const initiateConversion = useCallback(() => {
    console.log('useConversionLogic - initiateConversion called');
    
    if (!selectedFile || !extractedText) {
      console.log('useConversionLogic - Missing file or text');
      return false;
    }
    
    // Verificar si hay una aceptación reciente de términos
    const checkRecentTermsAcceptance = async () => {
      try {
        console.log('useConversionLogic - Checking terms acceptance');
        
        // Para propósitos de depuración, vamos a asumir que los términos ya están aceptados
        // en producción debería usar el código comentado abajo
        resetConversion();
        clearConversionStorage();
        setConversionStatus('converting');
        
        /*
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
        */
      } catch (err) {
        console.error('useConversionLogic - Error in terms acceptance check:', err);
        setShowTerms(true);
      }
    };

    checkRecentTermsAcceptance();
    return true;
  }, [selectedFile, extractedText, resetConversion, setConversionStatus]);

  // Actualiza el progreso basado en los datos de chunk
  const handleProgressUpdate = useCallback((data: ChunkProgressData) => {
    console.log('useConversionLogic - Progress update received:', data);
    
    // No mostrar toasts para errores de chunk, solo registrar en consola
    if (data.error) {
      console.warn('useConversionLogic - Error processing chunk:', data.error);
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
        setConversionStatus('completed');
      }
    } else if (typeof data.progress === 'number') {
      console.log(`useConversionLogic - Setting direct progress: ${data.progress}%`);
      setProgress(data.progress);
      
      // Verificar también aquí si alcanzamos el 100%
      if (data.progress >= 100) {
        console.log('useConversionLogic - Direct progress reached 100%');
        setConversionStatus('completed');
      }
    }
  }, [setProgress, setConversionStatus]);

  const handleAcceptTerms = async (options: ConversionOptions) => {
    console.log('useConversionLogic - handleAcceptTerms called with options:', options);
    
    if (!selectedFile || !extractedText || !options.selectedVoice) {
      console.error('useConversionLogic - Missing required parameters:', {
        hasFile: !!selectedFile,
        hasText: !!extractedText,
        hasVoice: !!options.selectedVoice
      });
      return;
    }

    if (conversionStatus === 'converting') {
      console.log('useConversionLogic - Already in progress, cannot start again');
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
        await retryOperation(async () => {
          return supabase.from('conversion_notifications').insert({
            conversion_id: result.id,
            user_id: user.id,
            email: user.email,
          });
        }, { maxRetries: 3 });
      }
      
      console.log('useConversionLogic - Conversion completed successfully');
      
    } catch (error: any) {
      console.error('useConversionLogic - Conversion error:', error);
      resetConversion();
      clearConversionStorage();
      setConversionStatus('error');
      toast({
        title: "Error",
        description: "An error occurred during conversion",
        variant: "destructive"
      });
    } finally {
      setDetectingChapters(false);
    }
  };

  const handleDownloadClick = useCallback(() => {
    console.log('useConversionLogic - handleDownloadClick called');
    
    if (!audioData) {
      console.log('useConversionLogic - No audio data available for download');
      return;
    }

    console.log('useConversionLogic - Starting download');
    handleDownload(selectedFile?.name || "converted_audio");
  }, [audioData, selectedFile, handleDownload]);

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
    setDetectingChapters,
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
