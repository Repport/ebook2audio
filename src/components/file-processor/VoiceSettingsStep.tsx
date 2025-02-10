
import React from 'react';
import VoiceSelector from '@/components/VoiceSelector';
import ChapterDetectionToggle from '@/components/ChapterDetectionToggle';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface VoiceSettingsStepProps {
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  detectedLanguage: string;
  detectChapters: boolean;
  setDetectChapters: (detect: boolean) => void;
  onNextStep: () => void;
}

const VoiceSettingsStep = ({
  selectedVoice,
  setSelectedVoice,
  detectedLanguage,
  detectChapters,
  setDetectChapters,
  onNextStep
}: VoiceSettingsStepProps) => {
  return (
    <>
      <VoiceSelector 
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        detectedLanguage={detectedLanguage}
      />
      
      <ChapterDetectionToggle 
        detectChapters={detectChapters}
        onToggle={setDetectChapters}
        chaptersFound={0}
      />

      <div className="flex justify-end mt-8">
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
