
import React, { useState, useEffect } from 'react';
import VoiceSelector from '@/components/VoiceSelector';
import ChapterDetectionToggle from '@/components/ChapterDetectionToggle';
import ConversionStatus from '@/components/ConversionStatus';
import ConversionControls from '@/components/ConversionControls';
import TermsDialog from '@/components/TermsDialog';
import { Chapter } from '@/utils/textExtraction';
import { VOICES } from '@/constants/voices';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { useToast } from '@/hooks/use-toast';

interface FileProcessorProps {
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => void;
  selectedFile: File | null;
  extractedText: string;
  chapters: Chapter[];
}

const FileProcessor = ({ onFileSelect, selectedFile, extractedText, chapters }: FileProcessorProps) => {
  const [detectChapters, setDetectChapters] = useState(true);
  const [detectingChapters, setDetectingChapters] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICES.english[0].id);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('english');
  const [showTerms, setShowTerms] = useState(false);
  const { toast } = useToast();

  const {
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    handleConversion,
    handleDownload,
    resetConversion
  } = useAudioConversion();

  // Reset conversion state when a new file is selected
  useEffect(() => {
    if (selectedFile) {
      resetConversion();
    }
  }, [selectedFile, resetConversion]);

  const initiateConversion = () => {
    if (!selectedFile || !extractedText) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      });
      return;
    }
    setShowTerms(true);
  };

  const handleAcceptTerms = async () => {
    if (!selectedFile || !extractedText) return;
    setDetectingChapters(true);
    try {
      await handleConversion(extractedText, selectedVoice, detectChapters, chapters, selectedFile.name);
    } catch (error) {
      toast({
        title: "Conversion failed",
        description: error.message || "An error occurred during conversion",
        variant: "destructive",
      });
    } finally {
      setDetectingChapters(false);
      setShowTerms(false);
    }
  };

  const handleDownloadClick = () => {
    if (selectedFile) {
      handleDownload(selectedFile.name);
    }
  };

  // Calculate estimated time based on text length (rough estimate)
  const estimatedSeconds = Math.ceil(extractedText.length / 20); // Assuming ~20 characters per second processing speed

  return (
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
        fileType={selectedFile?.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB'}
        chaptersFound={chapters.length}
        detectingChapters={detectingChapters}
        chapters={detectChapters ? chapters : []}
        estimatedSeconds={estimatedSeconds}
      />
      
      <ConversionControls 
        status={conversionStatus}
        onConvert={initiateConversion}
        onDownload={handleDownloadClick}
        fileSize={audioData?.byteLength}
        duration={audioDuration}
      />

      <TermsDialog 
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={handleAcceptTerms}
        fileName={selectedFile?.name || ''}
        fileType={selectedFile?.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB'}
      />
    </div>
  );
};

export default FileProcessor;
