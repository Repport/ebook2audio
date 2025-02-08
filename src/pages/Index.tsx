
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
      
      setConversionStatus('completed');
      setProgress(100);

      const chaptersList = chaptersWithTimestamps
        .map(ch => `${ch.title} (starts at ${ch.timestamp} minutes)`)
        .join('\n');

      toast({
        title: "Conversion completed",
        description: detectChapters 
          ? `Your MP3 file is ready with ${chapters.length} chapter markers:\n${chaptersList}`
          : "Your MP3 file is ready for download",
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
      description: "Your MP3 file will download shortly",
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
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
