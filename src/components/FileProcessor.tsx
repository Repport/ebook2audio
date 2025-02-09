
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceSelector from '@/components/VoiceSelector';
import ChapterDetectionToggle from '@/components/ChapterDetectionToggle';
import ConversionStatus from '@/components/ConversionStatus';
import ConversionControls from '@/components/ConversionControls';
import TermsDialog from '@/components/TermsDialog';
import { Chapter } from '@/utils/textExtraction';
import { VOICES } from '@/constants/voices';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FileProcessorProps {
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => void;
  selectedFile: File | null;
  extractedText: string;
  chapters: Chapter[];
}

const FileProcessor = ({ 
  onFileSelect, 
  selectedFile, 
  extractedText, 
  chapters 
}: FileProcessorProps) => {
  const [detectChapters, setDetectChapters] = useState(true);
  const [detectingChapters, setDetectingChapters] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICES.english[0].id);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('english');
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    handleConversion,
    handleDownload
  } = useAudioConversion();

  const initiateConversion = useCallback(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to convert text to audio.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    setShowTerms(true);
  }, [user, navigate, toast]);

  const handleAcceptTerms = useCallback(async () => {
    if (!selectedFile || !extractedText) return;
    
    setDetectingChapters(true);
    try {
      await handleConversion(
        extractedText, 
        selectedVoice, 
        detectChapters, 
        chapters, 
        selectedFile.name
      );
    } finally {
      setDetectingChapters(false);
    }
  }, [selectedFile, extractedText, selectedVoice, detectChapters, chapters, handleConversion]);

  const handleDownloadClick = useCallback(() => {
    if (selectedFile) {
      handleDownload(selectedFile.name);
    }
  }, [selectedFile, handleDownload]);

  return (
    <div className="animate-fade-up space-y-8">
      <VoiceSelector 
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
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
