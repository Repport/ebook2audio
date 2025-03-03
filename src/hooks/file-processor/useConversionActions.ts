
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { retryOperation } from '@/services/conversion/utils/retryUtils';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';
import { useToast } from '@/hooks/use-toast';
import { Chapter } from '@/utils/textExtraction';
import { ChunkProgressData } from '@/services/conversion/types/chunks';

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
  
  const initiateConversion = useCallback(async () => {
    console.log('useConversionLogic - initiateConversion called');
    
    if (!selectedFile || !extractedText) {
      console.log('useConversionLogic - Missing file or text');
      return false;
    }
    
    try {
      console.log('useConversionLogic - Checking terms acceptance');
      
      // For debugging, we'll reset the conversion state here
      audioConversion.resetConversion();
      clearConversionStorage();
      
      // Don't set to converting yet - wait until user actually starts conversion
      // audioConversion.setConversionStatus('converting');
      
      const termsAccepted = await checkTermsAcceptance();
      if (!termsAccepted) {
        setShowTerms(true);
        return true; // We're showing terms, so this is a successful flow
      }
      
      return true;
    } catch (err) {
      console.error('useConversionLogic - Error in terms acceptance check:', err);
      setShowTerms(true);
      return false;
    }
  }, [selectedFile, extractedText, audioConversion, checkTermsAcceptance, setShowTerms]);

  // Creamos un sistema más robusto de manejo de progreso
  const lastProgressRef = { current: 1 };
  const errorCountRef = { current: 0 };

  const handleProgressUpdate = useCallback((data: ChunkProgressData) => {
    console.log('useConversionLogic - Progress update received:', data);
    
    // Manejar errores sin dejar que afecten al progreso global
    if (data.error) {
      console.warn('useConversionLogic - Error processing chunk:', data.error);
      errorCountRef.current += 1;
    }
    
    // Check if this is a completion message
    if (data.isCompleted) {
      console.log('useConversionLogic - Conversion completed via progress update');
      audioConversion.setProgress(100);
      audioConversion.setConversionStatus('completed');
      return;
    }
    
    // Calcular y actualizar el progreso basado en los datos disponibles
    let newProgress = 0;
    
    if (data.processedCharacters && data.totalCharacters) {
      newProgress = Math.round((data.processedCharacters / data.totalCharacters) * 100);
    } else if (typeof data.progress === 'number') {
      newProgress = data.progress;
    } else if (data.processedChunks && data.totalChunks) {
      newProgress = Math.round((data.processedChunks / data.totalChunks) * 100);
    }
    
    // Garantizamos un progreso mínimo y no permitimos retrocesos
    if (newProgress > 0) {
      newProgress = Math.max(newProgress, lastProgressRef.current);
      
      // Solo actualizamos si hay un cambio significativo o es el progreso inicial
      if (newProgress > lastProgressRef.current || audioConversion.progress <= 1) {
        console.log(`useConversionLogic - Setting progress to ${newProgress}%`);
        audioConversion.setProgress(newProgress);
        lastProgressRef.current = newProgress;
        
        // Verificar si completamos la conversión
        if (newProgress >= 100) {
          console.log('useConversionLogic - Progress reached 100%, setting to completed');
          audioConversion.setConversionStatus('completed');
        }
      }
    } else {
      // Cuando no tenemos datos de progreso pero estamos procesando
      // asegurarnos de que al menos se muestre algo de progreso
      if (audioConversion.progress < 1) {
        console.log('useConversionLogic - Ensuring minimum progress visibility');
        audioConversion.setProgress(1);
      }
    }
  }, [audioConversion]);

  const handleAcceptTerms = useCallback(async (options: ConversionOptions) => {
    console.log('useConversionLogic - handleAcceptTerms called with options:', options);
    
    if (!selectedFile || !extractedText || !options.selectedVoice) {
      console.error('useConversionLogic - Missing required parameters:', {
        hasFile: !!selectedFile,
        hasText: !!extractedText,
        hasVoice: !!options.selectedVoice
      });
      
      // Use safe toast call - check if we're still mounted
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

    // Make sure we're not in a chapter detection state
    setDetectingChapters(false);
    
    // Establecemos inmediatamente el estado de conversión y un progreso inicial visible
    audioConversion.setConversionStatus('converting');
    audioConversion.setProgress(1);
    
    // Resetear contadores
    lastProgressRef.current = 1;
    errorCountRef.current = 0;
    
    try {
      console.log('useConversionLogic - Starting conversion with text length:', extractedText.length);
      
      // Use a try-catch with retry mechanism to handle conversion failures
      const result = await retryOperation(
        async () => {
          return await audioConversion.handleConversion(
            extractedText,
            options.selectedVoice,
            detectChapters,
            chapters,
            selectedFile.name,
            handleProgressUpdate
          );
        },
        { maxRetries: 2, baseDelay: 1000 }
      );
      
      if (!result) {
        console.error('useConversionLogic - Conversion failed or was cancelled');
        throw new Error('La conversión falló o fue cancelada');
      }
      
      console.log('useConversionLogic - Conversion result received:', result);
      
      // Make sure status is updated to completed
      audioConversion.setConversionStatus('completed');
      audioConversion.setProgress(100);
      
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
      
      // Don't reset here, just update status to error
      // This allows recovery of partial progress
      audioConversion.setConversionStatus('error');
      
      // Use safe toast call
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
    detectChapters, 
    chapters, 
    setDetectingChapters, 
    user, 
    handleProgressUpdate, 
    toast
  ]);

  const handleDownloadClick = useCallback(() => {
    console.log('useConversionLogic - handleDownloadClick called');
    
    if (!audioConversion.audioData) {
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
      audioConversion.handleDownload(selectedFile?.name || "converted_audio");
      
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
  }, [audioConversion.audioData, selectedFile, audioConversion.handleDownload, toast]);

  return {
    initiateConversion,
    handleAcceptTerms,
    handleDownloadClick
  };
};
