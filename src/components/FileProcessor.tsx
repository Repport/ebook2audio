
import React, { useState } from 'react';
import { VOICES } from '@/constants/voices';
import { Chapter } from '@/utils/textExtraction';
import { useAuth } from '@/hooks/useAuth';
import VoiceSettingsStep from '@/components/VoiceSettingsStep';
import ConversionStep from './file-processor/ConversionStep';
import TermsDialog from '@/components/TermsDialog';
import { useConversionLogic } from './file-processor/useConversionLogic';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

interface FileProcessorProps {
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => void;
  selectedFile: File | null;
  extractedText: string;
  chapters: Chapter[];
  onStepComplete?: () => void;
  currentStep: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
}

const FileProcessor = ({ 
  onFileSelect, 
  selectedFile, 
  extractedText, 
  chapters,
  onStepComplete,
  currentStep,
  onNextStep,
  onPreviousStep
}: FileProcessorProps) => {
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICES.english[0].id);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('english');
  const { user } = useAuth();
  const [notifyOnComplete, setNotifyOnComplete] = useState(false);

  const {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    showTerms,
    setShowTerms,
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    initiateConversion,
    handleAcceptTerms,
    handleDownloadClick,
    handleViewConversions,
    calculateEstimatedSeconds,
    conversionId
  } = useConversionLogic(selectedFile, extractedText, chapters, onStepComplete);

  const estimatedSeconds = calculateEstimatedSeconds();

  if (!selectedFile) return null;

  const handleGoBack = () => {
    onFileSelect(null);
  };

  const handleVoiceSettingsComplete = () => {
    onNextStep();
  };

  const handleConversionStart = async () => {
    setShowTerms(true);
  };

  const handleAcceptTermsAndConvert = async () => {
    await handleAcceptTerms({ selectedVoice, notifyOnComplete });
    setShowTerms(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-up">
      <div className="flex justify-start">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          onClick={handleGoBack}
        >
          <ArrowLeft className="w-4 h-4" />
          Change File
        </Button>
      </div>

      {currentStep === 2 && (
        <div className="animate-fade-up">
          <VoiceSettingsStep
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            detectedLanguage={detectedLanguage}
            detectChapters={detectChapters}
            setDetectChapters={setDetectChapters}
            onNextStep={handleVoiceSettingsComplete}
            notifyOnComplete={notifyOnComplete}
            setNotifyOnComplete={setNotifyOnComplete}
          />
        </div>
      )}
      
      {currentStep === 3 && (
        <div className="animate-fade-up">
          <ConversionStep
            selectedFile={selectedFile}
            conversionStatus={conversionStatus}
            progress={progress}
            audioData={audioData}
            audioDuration={audioDuration}
            estimatedSeconds={estimatedSeconds}
            onConvert={handleConversionStart}
            onDownloadClick={handleDownloadClick}
            onViewConversions={handleViewConversions}
            conversionId={conversionId}
          />
        </div>
      )}

      <TermsDialog 
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={handleAcceptTermsAndConvert}
        fileName={selectedFile?.name || ''}
        fileType={selectedFile?.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB'}
      />
    </div>
  );
};

export default FileProcessor;
