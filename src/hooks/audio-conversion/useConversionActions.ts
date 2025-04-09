
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { convertToAudio } from '@/services/conversion';
import { Chapter } from '@/utils/textExtraction';
import { TextChunkCallback } from '@/services/conversion/types/chunks';

export const useConversionActions = (
  setConversionStatus: (status: 'idle' | 'converting' | 'completed' | 'error') => void,
  setProgress: (progress: number) => void,
  setAudioData: (data: ArrayBuffer | null) => void,
  setAudioDuration: (duration: number) => void,
  setConversionId: (id: string | null) => void,
  setCurrentFileName: (fileName: string | null) => void,
  setElapsedTime: (time: number) => void,
  setConversionStartTime: (time: number | undefined) => void,
  clearConversionStorage: () => void
) => {
  const { toast } = useToast();

  const resetConversion = useCallback(() => {
    console.log('🧹 Resetting conversion state');
    setConversionStatus('idle');
    setProgress(0);
    setAudioData(null);
    setAudioDuration(0);
    setConversionId(null);
    setCurrentFileName(null);
    setElapsedTime(0);
    setConversionStartTime(undefined);
    clearConversionStorage();
  }, [setConversionStatus, setProgress, setAudioData, setAudioDuration, setConversionId, setCurrentFileName, setElapsedTime, setConversionStartTime, clearConversionStorage]);

  const handleConversion = useCallback(async (
    text: string,
    voiceId: string,
    onProgress?: TextChunkCallback,
    chapters?: Chapter[],
    fileName?: string
  ) => {
    try {
      setConversionStatus('converting');
      setProgress(0);
      setCurrentFileName(fileName || null);
      
      // Set the conversion start time
      const startTime = Date.now();
      setConversionStartTime(startTime);
      setElapsedTime(0);
      
      console.log(`🎯 Starting conversion for: ${fileName || 'unknown file'}`);
      console.log(`📊 Text length: ${text.length} characters`);
      
      // No chapter detection
      const result = await convertToAudio(text, voiceId, onProgress);
      
      console.log('✅ Conversion completed:', {
        hasAudio: !!result.audio,
        audioSize: result.audio?.byteLength,
        id: result.id
      });
      
      if (result.audio) {
        setAudioData(result.audio);
        
        // Calculate approximate duration (15 characters per second)
        const approximateDuration = Math.ceil(text.length / 15);
        setAudioDuration(approximateDuration);
      }
      
      if (result.id) {
        setConversionId(result.id);
      }
      
      setConversionStatus('completed');
      setProgress(100);
      return result;
      
    } catch (error: any) {
      console.error('❌ Conversion error:', error);
      setConversionStatus('error');
      
      toast({
        title: "Error en la conversión",
        description: error.message || "Ocurrió un error durante la conversión",
        variant: "destructive",
      });
      
      throw error;
    }
  }, [setConversionStatus, setProgress, setAudioData, setAudioDuration, setConversionId, setCurrentFileName, setConversionStartTime, setElapsedTime, toast]);

  const handleDownload = useCallback((fileName: string, audioData: ArrayBuffer | null) => {
    if (!audioData) {
      console.error('No audio data to download');
      return;
    }

    try {
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName.replace(/\.[^/.]+$/, '')}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading audio:', error);
      toast({
        title: "Error al descargar",
        description: "No se pudo descargar el archivo de audio",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    resetConversion,
    handleConversion,
    handleDownload
  };
};
