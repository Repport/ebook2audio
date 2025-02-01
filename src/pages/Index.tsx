import React, { useState } from 'react';
import FileUploadZone from '@/components/FileUploadZone';
import ConversionStatus from '@/components/ConversionStatus';
import VoiceSelector from '@/components/VoiceSelector';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState('EXAVITQu4vr4xnSDxMaL'); // Default to Sarah (female)
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

  const simulateChapterDetection = () => {
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
    
    // Simulate conversion progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    // Simulate conversion process
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
    // In a real implementation, this would download the actual converted file
    toast({
      title: "Download started",
      description: "Your MP3 file will download shortly",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">eBook to MP3 Converter</h1>
          <p className="text-lg text-gray-600">Convert your EPUB and PDF books to MP3 audio files</p>
        </div>

        <div className="space-y-8">
          <FileUploadZone onFileSelect={handleFileSelect} />

          {selectedFile && (
            <div className="animate-fade-up space-y-8">
              <VoiceSelector 
                selectedVoice={selectedVoice} 
                onVoiceChange={handleVoiceChange}
              />

              <div className="flex items-center space-x-2">
                <Switch
                  id="chapter-detection"
                  checked={detectChapters}
                  onCheckedChange={setDetectChapters}
                />
                <Label htmlFor="chapter-detection">
                  Detect and mark chapters in audio
                </Label>
              </div>
              
              <ConversionStatus 
                status={conversionStatus} 
                progress={progress}
                fileType={getFileType(selectedFile.name)}
                chaptersFound={chaptersFound}
                detectingChapters={detectingChapters}
              />
              
              <div className="flex justify-center mt-6 space-x-4">
                {conversionStatus === 'idle' && (
                  <Button onClick={handleConversion} className="bg-primary hover:bg-primary/90">
                    Start Conversion
                  </Button>
                )}
                
                {conversionStatus === 'completed' && (
                  <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90">
                    <Download className="mr-2 h-4 w-4" />
                    Download MP3
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;