
import { useCallback } from 'react';
import { convertToAudio } from '@/services/conversion';
import { saveToSupabase } from '@/services/storage/supabaseStorageService';
import { calculateAudioDuration } from '@/services/audio/audioUtils';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';
import { User } from '@supabase/supabase-js';
import { Chapter } from '@/utils/textExtraction';
import { supabase } from '@/integrations/supabase/client';

interface UseConversionActionsProps {
  user: User | null;
  toast: any;
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error';
  audioData: ArrayBuffer | null;
  currentFileName: string | null;
  setConversionStatus: (status: 'idle' | 'converting' | 'completed' | 'error') => void;
  setProgress: (progress: number) => void;
  setAudioData: (data: ArrayBuffer | null) => void;
  setAudioDuration: (duration: number) => void;
  setCurrentFileName: (name: string | null) => void;
  setConversionId: (id: string | null) => void;
}

interface ConversionResult {
  audio: ArrayBuffer;
  id: string;
}

export const useConversionActions = ({
  user,
  toast,
  audioData,
  currentFileName,
  setConversionStatus,
  setProgress,
  setAudioData,
  setAudioDuration,
  setCurrentFileName,
  setConversionId
}: UseConversionActionsProps) => {
  const resetConversion = useCallback(() => {
    setConversionStatus('idle');
    setProgress(0);
    setAudioData(null);
    setAudioDuration(0);
    setCurrentFileName(null);
    setConversionId(null);
    clearConversionStorage();
  }, [setConversionStatus, setProgress, setAudioData, setAudioDuration, setCurrentFileName, setConversionId]);

  const handleConversion = async (
    extractedText: string,
    selectedVoice: string,
    detectChapters: boolean,
    chapters: Chapter[],
    fileName: string
  ): Promise<ConversionResult> => {
    setConversionStatus('converting');
    setProgress(0);
    setCurrentFileName(fileName);
    
    try {
      console.log('Starting conversion for file:', fileName);
      console.log('Chapters to process:', chapters); // Debug log

      const chaptersWithTimestamps = chapters.map(chapter => ({
        ...chapter,
        timestamp: Math.floor(
          extractedText.substring(0, chapter.startIndex).split(/\s+/).length / 150
        )
      }));

      const { audio, id } = await convertToAudio(
        extractedText, 
        selectedVoice, 
        detectChapters ? chaptersWithTimestamps : undefined, 
        fileName
      );
      
      if (!audio) {
        throw new Error('No audio data received from conversion');
      }

      // Store chapters in the database
      if (detectChapters && chapters.length > 0) {
        const chapterInserts = chaptersWithTimestamps.map(chapter => ({
          conversion_id: id,
          title: chapter.title,
          start_index: chapter.startIndex,
          timestamp: chapter.timestamp
        }));

        const { error: chaptersError } = await supabase
          .from('chapters')
          .insert(chapterInserts);

        if (chaptersError) {
          console.error('Error storing chapters:', chaptersError);
        }
      }

      setConversionId(id);
      setAudioData(audio);
      
      const duration = await calculateAudioDuration(audio);
      setAudioDuration(duration);
      
      if (user) {
        console.log('Saving to Supabase for user:', user.id);
        await saveToSupabase(audio, extractedText, duration, fileName, user.id);
      }
      
      setConversionStatus('completed');
      setProgress(100);

      return { audio, id };

    } catch (error) {
      console.error('Conversion error:', error);
      setConversionStatus('error');
      setProgress(0);
      setCurrentFileName(null);
      setAudioData(null);
      throw error;
    }
  };

  const handleDownload = async (fileName: string) => {
    if (!audioData) return;

    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const originalName = fileName || currentFileName || 'converted';
    const baseName = originalName.substring(0, originalName.lastIndexOf('.') || originalName.length);
    link.download = `${baseName}.mp3`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return {
    handleConversion,
    handleDownload,
    resetConversion
  };
};
