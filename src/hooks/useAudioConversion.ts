
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { convertToAudio } from '@/services/conversion';
import { Chapter } from '@/utils/textExtraction';
import { 
  saveConversionState, 
  loadConversionState, 
  clearConversionStorage,
  convertArrayBufferToBase64 
} from '@/services/storage/conversionStorageService';
import { TextChunkCallback } from '@/services/conversion/types/chunks';

export const useAudioConversion = () => {
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [conversionId, setConversionId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [conversionStartTime, setConversionStartTime] = useState<number | undefined>(undefined);
  const { toast } = useToast();

  // Cargar estado guardado al inicio
  useEffect(() => {
    const loadState = async () => {
      const savedState = await loadConversionState();
      if (savedState) {
        setConversionStatus(savedState.status);
        setProgress(savedState.progress);
        setCurrentFileName(savedState.fileName || null);
        setConversionId(savedState.conversionId || null);
        
        // Restaurar el tiempo transcurrido si existe
        if (savedState.elapsedTime) {
          setElapsedTime(savedState.elapsedTime);
        }
        
        // Restaurar el tiempo de inicio si existe
        if (savedState.conversionStartTime) {
          setConversionStartTime(savedState.conversionStartTime);
        }
        
        if (savedState.audioData) {
          try {
            const audioArrayBuffer = new TextEncoder().encode(savedState.audioData).buffer;
            setAudioData(audioArrayBuffer);
          } catch (error) {
            console.error('Error converting saved audio data:', error);
          }
        }
        setAudioDuration(savedState.audioDuration);
      }
    };

    loadState();
  }, []);

  // Guardar estado cuando cambia
  useEffect(() => {
    const saveState = async () => {
      if (conversionStatus !== 'idle') {
        try {
          const currentTime = Date.now();
          const currentElapsedTime = Math.floor((currentTime - (conversionStartTime || currentTime)) / 1000);
          
          // Solo actualizar el tiempo transcurrido si es mayor que el actual
          // o si no tenemos un tiempo actual
          if (currentElapsedTime > elapsedTime || elapsedTime === 0) {
            setElapsedTime(currentElapsedTime);
          }
          
          const state = {
            status: conversionStatus,
            progress,
            audioData: audioData ? convertArrayBufferToBase64(audioData) : undefined,
            audioDuration,
            fileName: currentFileName || undefined,
            conversionId: conversionId || undefined,
            elapsedTime: currentElapsedTime,
            conversionStartTime
          };
          
          await saveConversionState(state);
        } catch (error) {
          console.error('Error saving conversion state:', error);
        }
      }
    };

    saveState();
  }, [conversionStatus, progress, audioData, audioDuration, currentFileName, conversionId, conversionStartTime, elapsedTime]);

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
  }, []);

  const handleConversion = useCallback(async (
    text: string,
    voiceId: string,
    detectChapters: boolean,
    chapters: Chapter[],
    fileName?: string,
    onProgress?: TextChunkCallback
  ) => {
    try {
      setConversionStatus('converting');
      setProgress(0);
      setCurrentFileName(fileName || null);
      
      // Establecer el tiempo de inicio de la conversión
      const startTime = Date.now();
      setConversionStartTime(startTime);
      setElapsedTime(0);
      
      console.log(`🎯 Starting conversion for: ${fileName || 'unknown file'}`);
      console.log(`📊 Text length: ${text.length} characters, Detecting chapters: ${detectChapters}`);
      
      const result = await convertToAudio(text, voiceId, onProgress);
      
      console.log('✅ Conversion completed:', {
        hasAudio: !!result.audio,
        audioSize: result.audio?.byteLength,
        id: result.id
      });
      
      if (result.audio) {
        setAudioData(result.audio);
        
        // Calcular duración aproximada (15 caracteres por segundo)
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
      
      return null;
    }
  }, [toast]);

  const handleDownload = useCallback((fileName: string) => {
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
  }, [audioData, toast]);

  return {
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    handleConversion,
    handleDownload,
    resetConversion,
    conversionId,
    elapsedTime,
    setProgress,
    setConversionStatus
  };
};
