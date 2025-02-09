
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { convertToAudio } from '@/services/conversionService';
import { Chapter } from '@/utils/textExtraction';
import { useAuth } from '@/hooks/useAuth';
import { saveConversionState, loadConversionState, convertArrayBufferToBase64, convertBase64ToArrayBuffer } from '@/services/storage/conversionStorageService';
import { calculateAudioDuration, formatDuration, formatFileSize } from '@/services/audio/audioUtils';
import { saveToSupabase } from '@/services/storage/supabaseStorageService';

export const useAudioConversion = () => {
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load stored state on mount
  useEffect(() => {
    const storedState = loadConversionState();
    if (storedState) {
      setConversionStatus(storedState.status);
      setProgress(storedState.progress);
      if (storedState.audioData) {
        setAudioData(convertBase64ToArrayBuffer(storedState.audioData));
      }
      setAudioDuration(storedState.audioDuration);
    }
  }, []);

  // Save state changes to storage
  useEffect(() => {
    if (conversionStatus === 'idle') return;
    
    saveConversionState({
      status: conversionStatus,
      progress,
      audioDuration,
      audioData: audioData ? convertArrayBufferToBase64(audioData) : undefined
    });
  }, [conversionStatus, progress, audioData, audioDuration]);

  const handleConversion = async (
    extractedText: string,
    selectedVoice: string,
    detectChapters: boolean,
    chapters: Chapter[],
    fileName: string
  ) => {
    setConversionStatus('converting');
    setProgress(0);
    
    try {
      const WORDS_PER_MINUTE = 150;
      const chaptersWithTimestamps = chapters.map(chapter => ({
        ...chapter,
        timestamp: Math.floor(
          extractedText.substring(0, chapter.startIndex).split(/\s+/).length / WORDS_PER_MINUTE
        )
      }));

      const audio = await convertToAudio(
        extractedText, 
        selectedVoice, 
        detectChapters ? chaptersWithTimestamps : undefined, 
        fileName,
        (progressValue, totalChunks, completedChunks) => {
          const chunkProgress = Math.round((completedChunks / totalChunks) * 100);
          setProgress(chunkProgress);
        }
      );
      
      setAudioData(audio);
      
      const duration = await calculateAudioDuration(audio);
      setAudioDuration(duration);
      
      if (user) {
        await saveToSupabase(audio, extractedText, duration, fileName, user.id);
      }
      
      setConversionStatus('completed');
      setProgress(100);

      const chaptersList = chaptersWithTimestamps
        .map(ch => `${ch.title} (starts at ${ch.timestamp} minutes)`)
        .join('\n');

      toast({
        title: "Conversion completed",
        description: `Your MP3 file is ready (${formatFileSize(audio.byteLength)}, ${formatDuration(duration)})${
          detectChapters && chapters.length ? `\n\nChapters:\n${chaptersList}` : ''
        }`,
      });
    } catch (error) {
      console.error('Conversion error:', error);
      setConversionStatus('error');
      toast({
        title: "Conversion failed",
        description: (error as Error).message || "An error occurred during conversion",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (fileName: string) => {
    if (!audioData) return;

    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const originalName = fileName;
    const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
    link.download = `${baseName}.mp3`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: `Your MP3 file (${formatFileSize(audioData.byteLength)}, ${formatDuration(audioDuration)}) will download shortly`,
    });
  };

  return {
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    handleConversion,
    handleDownload,
  };
};
