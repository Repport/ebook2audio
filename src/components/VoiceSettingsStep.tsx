
import React from 'react';
import VoiceSelector from '@/components/VoiceSelector';
import ChapterDetectionToggle from '@/components/ChapterDetectionToggle';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

interface VoiceSettingsStepProps {
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  detectedLanguage: string;
  detectChapters: boolean;
  setDetectChapters: (detect: boolean) => void;
  notifyOnComplete: boolean;
  setNotifyOnComplete: (notify: boolean) => void;
  onNextStep: () => Promise<boolean>; // Cambiado para aceptar una promesa de booleano
}

const VoiceSettingsStep = ({
  selectedVoice,
  setSelectedVoice,
  detectedLanguage,
  detectChapters,
  setDetectChapters,
  onNextStep,
  notifyOnComplete,
  setNotifyOnComplete
}: VoiceSettingsStepProps) => {
  const { user } = useAuth();
  
  console.log('VoiceSettingsStep - Received language:', detectedLanguage);

  return (
    <>
      <VoiceSelector 
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        detectedLanguage={detectedLanguage}
      />
      
      <div className="space-y-6 mt-8">
        <ChapterDetectionToggle 
          detectChapters={detectChapters}
          onToggle={setDetectChapters}
          chaptersFound={0}
        />

        {user && (
          <div className="flex items-center justify-center space-x-2">
            <Switch
              id="notify-complete"
              checked={notifyOnComplete}
              onCheckedChange={setNotifyOnComplete}
            />
            <Label htmlFor="notify-complete">
              Notify me by email when conversion is complete
            </Label>
          </div>
        )}
      </div>

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
