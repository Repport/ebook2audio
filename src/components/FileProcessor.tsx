
import React, { useState } from 'react';
import FileUploadZone from '@/components/FileUploadZone';
import VoiceSelector from '@/components/VoiceSelector';
import ChapterDetectionToggle from '@/components/ChapterDetectionToggle';
import ConversionStatus from '@/components/ConversionStatus';
import ConversionControls from '@/components/ConversionControls';
import TermsDialog from '@/components/TermsDialog';
import { Chapter } from '@/utils/textExtraction';
import { VOICES } from '@/constants/voices';
import { useAudioConversion } from '@/hooks/useAudioConversion';

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

  const {
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    handleConversion,
    handleDownload
  } = useAudioConversion();

  const initiateConversion = () => {
    setShowTerms(true);
  };

  const handleAcceptTerms = async () => {
    if (!selectedFile || !extractedText) return;
    setDetectingChapters(true);
    await handleConversion(extractedText, selectedVoice, detectChapters, chapters, selectedFile.name);
    setDetectingChapters(false);
  };

  const handleDownloadClick = () => {
    if (selectedFile) {
      handleDownload(selectedFile.name);
    }
  };

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
