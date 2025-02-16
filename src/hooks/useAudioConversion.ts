
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useConversionProcess } from '@/hooks/conversion/useConversionProcess';
import { Chapter, ConversionResult } from '@/types/conversion';
import { saveToSupabase } from '@/services/storage/supabaseStorageService';
import { useAuth } from '@/hooks/useAuth';

export const useAudioConversion = () => {
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [conversionId, setConversionId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const conversionProcess = useConversionProcess({
    user,
    toast,
    setConversionStatus,
    setProgress,
    setAudioData,
    setAudioDuration,
    setCurrentFileName,
    setConversionId
  });

  const resetConversion = useCallback(() => {
    setConversionStatus('idle');
    setProgress(0);
    setAudioData(null);
    setAudioDuration(0);
    setCurrentFileName(null);
    setConversionId(null);
  }, []);

  const handleConversion = useCallback(async (
    extractedText: string,
    selectedVoice: string,
    detectChapters: boolean,
    chapters: Chapter[],
    fileName: string,
    existingConversionId?: string
  ): Promise<ConversionResult> => {
    try {
      console.log('Starting conversion process with ID:', existingConversionId);
      const result = await conversionProcess(
        extractedText,
        selectedVoice,
        detectChapters,
        chapters,
        fileName,
        existingConversionId
      );

      if (user && result.audio) {
        await saveToSupabase(
          result.audio,
          extractedText,
          result.duration,
          fileName,
          user.id
        );
      }

      return result;
    } catch (error) {
      console.error('Error in handleConversion:', error);
      setConversionStatus('error');
      throw error;
    }
  }, [user, conversionProcess]);

  const handleDownload = useCallback((fileName: string) => {
    if (!audioData) {
      console.error('No audio data available for download');
      return;
    }

    const blob = new Blob([audioData], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName.replace(/\.[^/.]+$/, '')}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [audioData]);

  return {
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    currentFileName,
    conversionId,
    handleConversion,
    handleDownload,
    resetConversion,
    setProgress,
    setConversionStatus,
    setConversionId,
    setAudioData,
    setAudioDuration,
    setCurrentFileName
  };
};
