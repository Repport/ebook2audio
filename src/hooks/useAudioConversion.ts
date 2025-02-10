
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { convertToAudio } from '@/services/conversionService';
import { Chapter } from '@/utils/textExtraction';
import { useAuth } from '@/hooks/useAuth';
import { saveConversionState, loadConversionState, convertArrayBufferToBase64, convertBase64ToArrayBuffer, clearConversionStorage } from '@/services/storage/conversionStorageService';
import { calculateAudioDuration, formatDuration, formatFileSize } from '@/services/audio/audioUtils';
import { saveToSupabase } from '@/services/storage/supabaseStorageService';

export const useAudioConversion = () => {
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const storedState = loadConversionState();
    if (storedState) {
      console.log('Loaded stored conversion state:', storedState);
      setConversionStatus(storedState.status);
      setProgress(Math.min(storedState.progress, 100));
      setCurrentFileName(storedState.fileName || null);
      if (storedState.audioData) {
        try {
          const audio = convertBase64ToArrayBuffer(storedState.audioData);
          setAudioData(audio);
          setAudioDuration(storedState.audioDuration || 0);
        } catch (error) {
          console.error('Error loading stored audio data:', error);
          clearConversionStorage();
        }
      }
    }
  }, []);

  useEffect(() => {
    if (conversionStatus === 'idle') {
      clearConversionStorage();
      return;
    }
    
    try {
      console.log('Saving conversion state:', {
        status: conversionStatus,
        progress: Math.min(progress, 100),
        fileName: currentFileName,
        hasAudioData: !!audioData
      });

      saveConversionState({
        status: conversionStatus,
        progress: Math.min(progress, 100),
        audioDuration,
        fileName: currentFileName || undefined,
        audioData: audioData ? convertArrayBufferToBase64(audioData) : undefined
      });
    } catch (error) {
      console.error('Error saving conversion state:', error);
    }
  }, [conversionStatus, progress, audioData, audioDuration, currentFileName]);

  const resetConversion = useCallback(() => {
    setConversionStatus('idle');
    setProgress(0);
    setAudioData(null);
    setAudioDuration(0);
    setCurrentFileName(null);
    clearConversionStorage();
  }, []);

  const handleConversion = async (
    extractedText: string,
    selectedVoice: string,
    detectChapters: boolean,
    chapters: Chapter[],
    fileName: string
  ) => {
    setConversionStatus('converting');
    setProgress(0);
    setCurrentFileName(fileName);
    
    try {
      console.log('Starting conversion for file:', fileName);
      const chaptersWithTimestamps = chapters.map(chapter => ({
        ...chapter,
        timestamp: Math.floor(
          extractedText.substring(0, chapter.startIndex).split(/\s+/).length / 150
        )
      }));

      const audio = await convertToAudio(
        extractedText, 
        selectedVoice, 
        detectChapters ? chaptersWithTimestamps : undefined, 
        fileName,
        (progressValue, totalChunks, completedChunks) => {
          const chunkProgress = Math.min(
            Math.round((completedChunks / totalChunks) * 100),
            100
          );
          setProgress(chunkProgress);
        }
      );
      
      if (!audio) {
        throw new Error('No audio data received from conversion');
      }

      console.log('Conversion completed, processing audio data');
      setAudioData(audio);
      
      const duration = await calculateAudioDuration(audio);
      setAudioDuration(duration);
      
      if (user) {
        console.log('Saving to Supabase for user:', user.id);
        await saveToSupabase(audio, extractedText, duration, fileName, user.id);
      }
      
      setConversionStatus('completed');
      setProgress(100);

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
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    currentFileName,
    handleConversion,
    handleDownload,
    resetConversion
  };
};
