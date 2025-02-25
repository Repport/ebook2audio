
import { useCallback } from 'react';
import { convertToAudio } from '@/services/conversion';
import { ExtractedChapter } from '@/types/conversion';
import { User } from '@supabase/supabase-js';
import { TextChunkCallback } from '@/services/conversion/types/chunks';

interface UseConversionProcessProps {
  user: User | null;
  toast: any;
  setConversionStatus: (status: 'idle' | 'converting' | 'completed' | 'error') => void;
  setProgress: (progress: number) => void;
  setAudioData: (data: ArrayBuffer | null) => void;
  setAudioDuration: (duration: number) => void;
  setCurrentFileName: (name: string | null) => void;
  setConversionId: (id: string | null) => void;
}

export const useConversionProcess = ({
  user,
  toast,
  setConversionStatus,
  setProgress,
  setAudioData,
  setAudioDuration,
  setCurrentFileName,
  setConversionId
}: UseConversionProcessProps) => {
  return useCallback(async (
    extractedText: string,
    selectedVoice: string,
    detectChapters: boolean,
    chapters: ExtractedChapter[],
    fileName: string,
    onProgressCallback?: TextChunkCallback
  ) => {
    setConversionStatus('converting');
    setProgress(0);
    setCurrentFileName(fileName);
    
    try {
      console.log('Starting conversion process for file:', fileName);
      
      const onProgressUpdate = (progressData: any) => {
        const { processedCharacters, totalCharacters } = progressData;
        const progress = Math.round((processedCharacters / totalCharacters) * 100);
        console.log(`Setting conversion progress: ${progress}%`);
        setProgress(progress);
        
        // Forward progress to external callback if provided
        if (onProgressCallback) {
          onProgressCallback(progressData);
        }
      };

      const result = await convertToAudio(
        extractedText,
        selectedVoice,
        onProgressUpdate
      );
      
      setConversionId(result.id);
      setAudioData(result.audio);
      
      // Calcular la duración aproximada basada en el tamaño del texto
      const approximateDuration = Math.ceil(extractedText.length / 15); // ~15 caracteres por segundo
      setAudioDuration(approximateDuration);
      
      setConversionStatus('completed');
      setProgress(100);
      
      return result;

    } catch (error: any) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion failed",
        description: error.message || "An error occurred during conversion",
        variant: "destructive",
      });
      setConversionStatus('error');
      return null;
    }
  }, [
    toast, 
    setConversionStatus, 
    setProgress, 
    setAudioData, 
    setAudioDuration, 
    setCurrentFileName, 
    setConversionId
  ]);
};
