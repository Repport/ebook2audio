
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceSelector from '@/components/VoiceSelector';
import ChapterDetectionToggle from '@/components/ChapterDetectionToggle';
import ConversionStatus from '@/components/ConversionStatus';
import ConversionControls from '@/components/ConversionControls';
import TermsDialog from '@/components/TermsDialog';
import { Chapter } from '@/utils/textExtraction';
import { VOICES } from '@/constants/voices';
import { useAudioConversion } from '@/hooks/useAudioConversion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface FileProcessorProps {
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => void;
  selectedFile: File | null;
  extractedText: string;
  chapters: Chapter[];
  onStepComplete?: () => void;
}

const FileProcessor = ({ 
  onFileSelect, 
  selectedFile, 
  extractedText, 
  chapters,
  onStepComplete 
}: FileProcessorProps) => {
  const [detectChapters, setDetectChapters] = useState(true);
  const [detectingChapters, setDetectingChapters] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICES.english[0].id);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('english');
  const [showTerms, setShowTerms] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    handleConversion,
    handleDownload,
    resetConversion
  } = useAudioConversion();

  useEffect(() => {
    if (selectedFile) {
      resetConversion();
    }
  }, [selectedFile, resetConversion]);

  useEffect(() => {
    if (conversionStatus === 'completed' && onStepComplete) {
      onStepComplete();
    }
  }, [conversionStatus, onStepComplete]);

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

  const handleViewConversions = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view your conversions",
      });
      navigate('/auth', { state: { from: '/conversions' } });
      return;
    }
    navigate('/conversions');
  };

  const calculateEstimatedSeconds = () => {
    if (!extractedText) return 0;
    const baseTimePerChar = 0.015;
    const overhead = 5;
    const chunkSize = 5000;
    const numberOfChunks = Math.ceil(extractedText.length / chunkSize);
    const chunkOverhead = numberOfChunks * 0.5;
    return Math.ceil((extractedText.length * baseTimePerChar) + overhead + chunkOverhead);
  };

  const estimatedSeconds = calculateEstimatedSeconds();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-up">
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
      
      <div className="flex justify-center">
        <ConversionStatus 
          status={conversionStatus} 
          progress={progress}
          fileType={selectedFile?.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB'}
          chaptersFound={chapters.length}
          detectingChapters={detectingChapters}
          chapters={detectChapters ? chapters : []}
          estimatedSeconds={estimatedSeconds}
        />
      </div>
      
      <ConversionControls 
        status={conversionStatus}
        onConvert={initiateConversion}
        onDownload={handleDownloadClick}
        fileSize={audioData?.byteLength}
        duration={audioDuration}
      />

      {user && conversionStatus === 'completed' && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleViewConversions}
          >
            View All Conversions
          </Button>
        </div>
      )}

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
