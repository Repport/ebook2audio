import React, { useState } from 'react';
import FileUploadZone from '@/components/FileUploadZone';
import ConversionStatus from '@/components/ConversionStatus';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import ChapterDetectionToggle from '@/components/ChapterDetectionToggle';
import ConversionControls from '@/components/ConversionControls';
import VoiceSelector from '@/components/VoiceSelector';
import { convertToAudio } from '@/services/conversionService';
import { VOICES } from '@/constants/voices';
import { processFile } from '@/utils/textExtraction';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [detectChapters, setDetectChapters] = useState(true);
  const [chaptersFound, setChaptersFound] = useState(0);
  const [detectingChapters, setDetectingChapters] = useState(false);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICES.english[0].id);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('english');
  const { toast } = useToast();

  const getFileType = (fileName: string): 'PDF' | 'EPUB' => {
    return fileName.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB';
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    try {
      const result = await processFile(file);
      setDetectedLanguage(result.metadata?.language || 'english');
      const languageVoices = VOICES[result.metadata?.language as keyof typeof VOICES] || VOICES.english;
      setSelectedVoice(languageVoices[0].id);
      
      const fileType = getFileType(file.name);
      toast({
        title: "File selected",
        description: `${file.name} (${fileType}) is ready for conversion`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process file language",
        variant: "destructive",
      });
    }
  };

  const simulateChapterDetection = async () => {
    setDetectingChapters(true);
    let chapters = 0;
    const interval = setInterval(() => {
      chapters += 1;
      setChaptersFound(chapters);
      if (chapters >= 10) {
        clearInterval(interval);
        setDetectingChapters(false);
        toast({
          title: "Chapters detected",
          description: `Found ${chapters} chapters in your document`,
        });
      }
    }, 500);
  };

  const handleConversion = async () => {
    if (!selectedFile) return;

    setConversionStatus('converting');
    setProgress(0);
    
    try {
      if (detectChapters) {
        await simulateChapterDetection();
      }

      const text = await selectedFile.text();
      
      const audio = await convertToAudio(text, selectedVoice);
      setAudioData(audio);
      
      setConversionStatus('completed');
      setProgress(100);
      toast({
        title: "Conversion completed",
        description: detectChapters 
          ? "Your MP3 file is ready for download with chapter markers"
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
              />
              
              <ConversionStatus 
                status={conversionStatus} 
                progress={progress}
                fileType={getFileType(selectedFile.name)}
                chaptersFound={chaptersFound}
                detectingChapters={detectingChapters}
              />
              
              <ConversionControls 
                status={conversionStatus}
                onConvert={handleConversion}
                onDownload={handleDownload}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
