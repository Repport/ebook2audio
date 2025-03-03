
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { retryOperation } from '@/services/conversion/utils/retryUtils';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';
import { useToast } from '@/hooks/use-toast';
import { Chapter } from '@/utils/textExtraction';
import { useConversionStore } from '@/store/conversionStore';

// Define the shape of the audio conversion API we're expecting
interface AudioConversionAPI {
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  audioData: ArrayBuffer | null;
  audioDuration: number;
  elapsedTime: number;
  conversionId: string | null;
  setProgress: (progress: number) => void;
  setConversionStatus: (status: 'idle' | 'converting' | 'completed' | 'error') => void;
  resetConversion: () => void;
  // Define the actual conversion method that matches useAudioConversion's implementation
  handleConversion: (text: string, voiceId: string, detectChapters: boolean, chapters: Chapter[], fileName?: string, onProgress?: any) => Promise<any>;
  handleDownload: (fileName: string) => void;
}

export interface ConversionOptions {
  selectedVoice: string;
  notifyOnComplete?: boolean;
}

export const useConversionActions = (
  selectedFile: File | null,
  extractedText: string,
  audioConversion: AudioConversionAPI,
  checkTermsAcceptance: () => Promise<boolean>,
  setShowTerms: (show: boolean) => void,
  setDetectingChapters: (detecting: boolean) => void,
  detectChapters: boolean,
  chapters: Chapter[]
) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const conversionStore = useConversionStore();
  
  const initiateConversion = useCallback(async () => {
    console.log('useConversionLogic - initiateConversion called');
    
    if (!selectedFile || !extractedText) {
      console.log('useConversionLogic - Missing file or text');
      return false;
    }
    
    try {
      console.log('useConversionLogic - Checking terms acceptance');
      
      // Para depuración, reseteamos el estado de conversión aquí
      audioConversion.resetConversion();
      conversionStore.resetConversion();
      clearConversionStorage();
      
      const termsAccepted = await checkTermsAcceptance();
      if (!termsAccepted) {
        setShowTerms(true);
        return true; // Estamos mostrando términos, así que este es un flujo exitoso
      }
      
      return true;
    } catch (err) {
      console.error('useConversionLogic - Error in terms acceptance check:', err);
      setShowTerms(true);
      return false;
    }
  }, [selectedFile, extractedText, audioConversion, conversionStore, checkTermsAcceptance, setShowTerms]);

  const handleAcceptTerms = useCallback(async (options: ConversionOptions) => {
    console.log('useConversionLogic - handleAcceptTerms called with options:', options);
    
    if (!selectedFile || !extractedText || !options.selectedVoice) {
      console.error('useConversionLogic - Missing required parameters:', {
        hasFile: !!selectedFile,
        hasText: !!extractedText,
        hasVoice: !!options.selectedVoice
      });
      
      toast({
        title: "Error",
        description: "Missing required data for conversion",
        variant: "destructive",
      });
      return;
    }

    if (audioConversion.conversionStatus === 'converting') {
      console.log('useConversionLogic - Already in progress, cannot start again');
      return;
    }

    // Asegurarnos de que no estamos en estado de detección de capítulos
    setDetectingChapters(false);
    
    // Establecer estado de conversión en los dos sistemas (actual y nuevo)
    audioConversion.setConversionStatus('converting');
    audioConversion.setProgress(1);
    
    // Inicializar el nuevo store con datos iniciales
    conversionStore.startConversion(selectedFile.name);
    
    try {
      console.log('useConversionLogic - Starting conversion with text length:', extractedText.length);
      
      // Usar un mecanismo de reintento para manejar errores de conversión
      const result = await retryOperation(
        async () => {
          return await audioConversion.handleConversion(
            extractedText,
            options.selectedVoice,
            detectChapters,
            chapters,
            selectedFile.name,
            (data: any) => {
              // Actualizar también el nuevo store global
              conversionStore.updateProgress(data);
            }
          );
        },
        { maxRetries: 2, baseDelay: 1000 }
      );
      
      if (!result) {
        console.error('useConversionLogic - Conversion failed or was cancelled');
        throw new Error('La conversión falló o fue cancelada');
      }
      
      console.log('useConversionLogic - Conversion result received:', result);
      
      // Asegurarnos de que el estado se actualiza a completado en ambos sistemas
      audioConversion.setConversionStatus('completed');
      audioConversion.setProgress(100);
      
      // Actualizar el store global con el resultado
      conversionStore.completeConversion(
        result.audio, 
        result.id,
        Math.ceil(extractedText.length / 15) // Duración aproximada
      );
      
      // Create notification if enabled and user is authenticated
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
      
      // Show completion toast
      toast({
        title: "Conversion complete",
        description: "Your audio file is ready to download",
        variant: "success",
      });
      
    } catch (error: any) {
      console.error('useConversionLogic - Conversion error:', error);
      
      // Actualizar estado a error en ambos sistemas
      audioConversion.setConversionStatus('error');
      conversionStore.setError(error.message || "Error desconocido en la conversión");
      
      toast({
        title: "Error",
        description: error.message || "An error occurred during conversion",
        variant: "destructive"
      });
    } finally {
      setDetectingChapters(false);
    }
  }, [
    selectedFile, 
    extractedText, 
    audioConversion, 
    conversionStore,
    detectChapters, 
    chapters, 
    setDetectingChapters, 
    user, 
    toast
  ]);

  const handleDownloadClick = useCallback(() => {
    console.log('useConversionLogic - handleDownloadClick called');
    
    // Usar el audioData del store global si está disponible, si no, usar el del audioConversion
    const audioData = conversionStore.audioData || audioConversion.audioData;
    
    if (!audioData) {
      console.log('useConversionLogic - No audio data available for download');
      
      toast({
        title: "Error",
        description: "No audio data available for download",
        variant: "destructive",
      });
      
      return;
    }

    console.log('useConversionLogic - Starting download');
    try {
      // Determinar el nombre del archivo
      const fileName = conversionStore.fileName || selectedFile?.name || "converted_audio";
      
      audioConversion.handleDownload(fileName);
      
      toast({
        title: "Download started",
        description: "Your audio file is being downloaded",
        variant: "success",
      });
    } catch (error) {
      console.error('useConversionLogic - Download error:', error);
      
      toast({
        title: "Download error",
        description: "Failed to download the audio file",
        variant: "destructive",
      });
    }
  }, [conversionStore, audioConversion, selectedFile, toast]);

  return {
    initiateConversion,
    handleAcceptTerms,
    handleDownloadClick
  };
};
