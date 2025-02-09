
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { convertToAudio } from '@/services/conversionService';
import { Chapter } from '@/utils/textExtraction';

export const useAudioConversion = () => {
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const { toast } = useToast();

  const calculateAudioDuration = (buffer: ArrayBuffer) => {
    const blob = new Blob([buffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    return new Promise<number>((resolve) => {
      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        URL.revokeObjectURL(url);
        resolve(duration);
      });
    });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

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
      const chaptersWithTimestamps = chapters.map(chapter => {
        const textBeforeChapter = extractedText.substring(0, chapter.startIndex);
        const wordCount = textBeforeChapter.split(/\s+/).length;
        const minutesMark = Math.floor(wordCount / WORDS_PER_MINUTE);
        return {
          ...chapter,
          timestamp: minutesMark
        };
      });

      const audio = await convertToAudio(
        extractedText, 
        selectedVoice, 
        detectChapters ? chaptersWithTimestamps : undefined, 
        fileName,
        (progressValue, totalChunks, completedChunks) => {
          // Calculate progress based on chunks
          const chunkProgress = Math.round((completedChunks / totalChunks) * 100);
          setProgress(chunkProgress);
        }
      );
      
      setAudioData(audio);
      
      const duration = await calculateAudioDuration(audio);
      setAudioDuration(duration);
      
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

  const handleDownload = (fileName: string) => {
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
