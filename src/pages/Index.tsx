
import React, { useState } from 'react';
import FileUploadZone from '@/components/FileUploadZone';
import ConversionStatus from '@/components/ConversionStatus';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import ChapterDetectionToggle from '@/components/ChapterDetectionToggle';
import ConversionControls from '@/components/ConversionControls';
import VoiceSelector from '@/components/VoiceSelector';
import TermsDialog from '@/components/TermsDialog';
import { convertToAudio } from '@/services/conversionService';
import { VOICES } from '@/constants/voices';
import { Chapter } from '@/utils/textExtraction';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [detectChapters, setDetectChapters] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [detectingChapters, setDetectingChapters] = useState(false);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICES.english[0].id);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('english');
  const [showTerms, setShowTerms] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const { toast } = useToast();

  const handleFileSelect = async (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => {
    if (!fileInfo) {
      setSelectedFile(null);
      setExtractedText('');
      setChapters([]);
      return;
    }

    setSelectedFile(fileInfo.file);
    setExtractedText(fileInfo.text);
    setChapters(fileInfo.chapters || []);
    setDetectedLanguage(fileInfo.language || 'english');
    const languageVoices = VOICES[fileInfo.language as keyof typeof VOICES] || VOICES.english;
    setSelectedVoice(languageVoices[0].id);

    if (fileInfo.chapters?.length) {
      toast({
        title: "Chapters detected",
        description: `Found ${fileInfo.chapters.length} chapters in your document`,
      });
    }
  };

  const initiateConversion = () => {
    setShowTerms(true);
  };

  const calculateAudioDuration = (buffer: ArrayBuffer) => {
    // Create a temporary audio element to get duration
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

  const handleConversion = async () => {
    if (!selectedFile || !extractedText) return;

    setConversionStatus('converting');
    setProgress(0);
    
    try {
      setDetectingChapters(true);
      
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

      const audio = await convertToAudio(extractedText, selectedVoice, detectChapters ? chaptersWithTimestamps : undefined);
      setAudioData(audio);
      
      // Calculate audio duration
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
        description: error.message || "An error occurred during conversion",
        variant: "destructive",
      });
    } finally {
      setDetectingChapters(false);
    }
  };

  const handleDownload = () => {
    if (!audioData) return;

    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const originalName = selectedFile?.name || 'converted';
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Header />

        <div className="space-y-8">
          <FileUploadZone onFileSelect={handleFileSelect} />

          {selectedFile && (
            <div className="animate-fade-up space-y-8">
              <VoiceSelector 
                selectedVoice={selectedVoice}
                onVoiceChange={(value: string) => setSelectedVoice(value)}
                detectedLanguage={detectedLanguage}
              />
              
              <ChapterDetectionToggle 
                detectChapters={detectChapters}
                onToggle={setDetectChapters}
                chaptersFound={chapters.length}
              />
              
              <ConversionStatus 
                status={conversionStatus} 
                progress={progress}
                fileType={selectedFile.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB'}
                chaptersFound={chapters.length}
                detectingChapters={detectingChapters}
              />
              
              <ConversionControls 
                status={conversionStatus}
                onConvert={initiateConversion}
                onDownload={handleDownload}
              />

              <TermsDialog 
                open={showTerms}
                onClose={() => setShowTerms(false)}
                onAccept={handleConversion}
                fileName={selectedFile.name}
                fileType={selectedFile.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

