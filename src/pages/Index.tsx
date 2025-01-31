import React, { useState } from 'react';
import FileUploadZone from '@/components/FileUploadZone';
import ConversionStatus from '@/components/ConversionStatus';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    toast({
      title: "File selected",
      description: `${file.name} is ready for conversion`,
    });
  };

  const handleConversion = async () => {
    if (!selectedFile) return;

    setConversionStatus('converting');
    
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
        description: "Your MP3 file is ready for download",
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">EPUB to MP3 Converter</h1>
          <p className="text-lg text-gray-600">Convert your EPUB books to MP3 audio files</p>
        </div>

        <div className="space-y-8">
          <FileUploadZone onFileSelect={handleFileSelect} />

          {selectedFile && (
            <div className="animate-fade-up">
              <ConversionStatus status={conversionStatus} progress={progress} />
              
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