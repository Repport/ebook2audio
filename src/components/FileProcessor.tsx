
import React, { useState } from 'react';
import { VOICES } from '@/constants/voices';
import { Chapter } from '@/utils/textExtraction';
import { useAuth } from '@/hooks/useAuth';
import VoiceSettingsStep from './file-processor/VoiceSettingsStep';
import ConversionStep from './file-processor/ConversionStep';
import TermsDialog from '@/components/TermsDialog';
import { useConversionLogic } from './file-processor/useConversionLogic';

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
  } = useConversionLogic(selectedFile, extractedText, chapters, onStepComplete);

  const estimatedSeconds = calculateEstimatedSeconds();

  if (!selectedFile) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-up">
      {currentStep === 1 && (
        <div className="animate-fade-up">
          <VoiceSettingsStep
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            detectedLanguage={detectedLanguage}
            detectChapters={detectChapters}
            setDetectChapters={setDetectChapters}
            onNextStep={onNextStep}
          />
        </div>
      )}
      
      {currentStep === 2 && (
        <div className="animate-fade-up">
          <ConversionStep
            selectedFile={selectedFile}
            conversionStatus={conversionStatus}
            progress={progress}
            audioData={audioData}
            audioDuration={audioDuration}
            estimatedSeconds={estimatedSeconds}
            onConvert={initiateConversion}
            onDownloadClick={handleDownloadClick}
            onViewConversions={handleViewConversions}
          />
        </div>
      )}

      <TermsDialog 
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => handleAcceptTerms(selectedVoice)}
        fileName={selectedFile?.name || ''}
        fileType={selectedFile?.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB'}
      />
    </div>
  );
};

export default FileProcessor;
