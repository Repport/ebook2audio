
import React, { useState } from 'react';
import { Chapter } from '@/utils/textExtraction';
import VoiceSettingsStep from './VoiceSettingsStep';
import ConversionStep from './file-processor/ConversionStep';
import TermsDialog from './TermsDialog';
import { useConversionLogic } from './file-processor/useConversionLogic';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileProcessorProps {
  onFileSelect: (fileInfo: { file: File, text: string, language?: string, chapters?: Chapter[] } | null) => void;
  selectedFile: File | null;
  extractedText: string;
  chapters: Chapter[];
  detectedLanguage: string;
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
  detectedLanguage,
  onStepComplete,
  currentStep,
  onNextStep,
  onPreviousStep
}: FileProcessorProps) => {
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [notifyOnComplete, setNotifyOnComplete] = useState(false);
  const [isShowingTerms, setIsShowingTerms] = useState(false);
  const { toast } = useToast();

  const {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    conversionStatus,
    progress,
    audioData,
    audioDuration,
    initiateConversion,
    handleAcceptTerms,
    handleDownloadClick,
    handleViewConversions,
    calculateEstimatedSeconds,
    conversionId,
    setProgress,
    setConversionStatus
  } = useConversionLogic(selectedFile, extractedText, chapters, onStepComplete);

  const estimatedSeconds = calculateEstimatedSeconds();

  if (!selectedFile) return null;

  const handleGoBack = () => {
    onFileSelect(null);
  };

  const handleVoiceSettingsComplete = () => {
    if (!selectedVoice) {
      console.error('No voice selected');
      toast({
        title: "Voice Required",
        description: "Please select a voice before continuing",
        variant: "destructive",
      });
      return;
    }
    setConversionStatus('idle');
    onNextStep();
  };

  const handleConversionStart = async () => {
    if (!selectedVoice) {
      console.error('No voice selected', { selectedVoice });
      toast({
        title: "Voice Required",
        description: "Please select a voice before starting conversion",
        variant: "destructive",
      });
      return false;
    }

    console.log('Showing terms dialog...');
    setIsShowingTerms(true);
    return false;
  };

  const handleAcceptTermsAndConvert = async () => {
    if (!selectedVoice) {
      console.error('No voice selected during terms acceptance', { selectedVoice });
      toast({
        title: "Voice Required",
        description: "Please select a voice before starting conversion",
        variant: "destructive",
      });
      return;
    }

    setIsShowingTerms(false);
    
    await handleAcceptTerms({ 
      selectedVoice,
      notifyOnComplete 
    });
  };

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-2xl mx-auto">
      <div className="w-full mb-8">
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

      <div className="w-full space-y-8">
        {currentStep === 2 && (
          <div className="animate-fade-up w-full">
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
          <div className="animate-fade-up w-full">
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
              chapters={chapters}
              detectingChapters={detectingChapters}
              textLength={extractedText.length}
            />
          </div>
        )}

        <TermsDialog 
          open={isShowingTerms}
          onClose={() => setIsShowingTerms(false)}
          onAccept={handleAcceptTermsAndConvert}
          fileName={selectedFile?.name || ''}
          fileType={selectedFile?.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB'}
        />
      </div>
    </div>
  );
};

export default FileProcessor;
