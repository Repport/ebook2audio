
import React from 'react';
import VoiceSelector from '@/components/VoiceSelector';
import ChapterDetectionToggle from '@/components/ChapterDetectionToggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Chapter } from '@/utils/textExtraction';

interface VoiceSettingsStepProps {
  selectedVoice: string;
  onVoiceChange: (value: string) => void;
  detectedLanguage: string;
  detectChapters: boolean;
  onToggleChapters: (value: boolean) => void;
  chapters: Chapter[];
  onPreviousStep: () => void;
  onNextStep: () => void;
}

const VoiceSettingsStep = ({
  selectedVoice,
  onVoiceChange,
  detectedLanguage,
  detectChapters,
  onToggleChapters,
  chapters,
  onPreviousStep,
  onNextStep
}: VoiceSettingsStepProps) => {
  return (
    <>
      <VoiceSelector 
        selectedVoice={selectedVoice}
        onVoiceChange={onVoiceChange}
        detectedLanguage={detectedLanguage}
      />
      
      <ChapterDetectionToggle 
        detectChapters={detectChapters}
        onToggle={onToggleChapters}
        chaptersFound={chapters.length}
      />

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={onPreviousStep}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Upload
        </Button>
        <Button
          onClick={onNextStep}
          className="flex items-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </>
  );
};

export default VoiceSettingsStep;
