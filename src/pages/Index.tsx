import React, { useState } from 'react';
import FileUploadZone from '@/components/FileUploadZone';
import ConversionStatus from '@/components/ConversionStatus';
import VoiceSelector from '@/components/VoiceSelector';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import ChapterDetectionToggle from '@/components/ChapterDetectionToggle';
import ConversionControls from '@/components/ConversionControls';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState('EXAVITQu4vr4xnSDxMaL');
  const [detectChapters, setDetectChapters] = useState(true);
  const [chaptersFound, setChaptersFound] = useState(0);
  const [detectingChapters, setDetectingChapters] = useState(false);
  const { toast } = useToast();

  const getFileType = (fileName: string): 'PDF' | 'EPUB' => {
    return fileName.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB';
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const fileType = getFileType(file.name);
    toast({
      title: "File selected",
      description: `${file.name} (${fileType}) is ready for conversion`,
    });
  };

  const handleVoiceChange = (value: string) => {
    setSelectedVoice(value);
    toast({
      title: "Voice updated",
      description: `Voice has been updated to ${value === 'EXAVITQu4vr4xnSDxMaL' ? 'Sarah' : 'Charlie'}`,
    });
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
    
    if (detectChapters) {
      await simulateChapterDetection();
    }
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
      setConversionStatus('completed');
      setProgress(100);
      toast({
        title: "Conversion completed",
        description: detectChapters 
          ? "Your MP3 file is ready for download with chapter markers"
          : "Your MP3 file is ready for download",
      });
    }, 5000);
  };

  const handleDownload = () => {
    if (!selectedFile) return;

    const dummyAudioBlob = new Blob(['dummy audio content'], { type: 'audio/mp3' });
    const url = window.URL.createObjectURL(dummyAudioBlob);
    const link = document.createElement('a');
    link.href = url;
    
    const originalName = selectedFile.name;
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
                onVoiceChange={handleVoiceChange}
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