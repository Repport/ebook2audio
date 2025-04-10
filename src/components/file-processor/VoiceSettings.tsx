
import React from 'react';
import { Button } from '@/components/ui/button';
import VoiceSelector from '@/components/VoiceSelector';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';

interface VoiceSettingsProps {
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  notifyOnComplete: boolean;
  setNotifyOnComplete: (notify: boolean) => void;
  isProcessingNextStep?: boolean;
  onStartConversion: () => Promise<boolean>;
  onBack?: () => void;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  selectedVoice,
  setSelectedVoice,
  notifyOnComplete,
  setNotifyOnComplete,
  isProcessingNextStep = false,
  onStartConversion,
  onBack
}) => {
  const { translations } = useLanguage();
  
  return (
    <div className="animate-fade-up space-y-6">
      <h2 className="text-xl font-medium mb-4">
        {translations.voiceSettings || "Voice Settings"}
      </h2>
      
      <div className="space-y-6">
        <VoiceSelector
          selectedVoice={selectedVoice}
          onVoiceChange={setSelectedVoice}
          detectedLanguage={null}
        />
        
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="notify-complete" className="cursor-pointer">
            Notify me when conversion is complete
          </Label>
          <Switch
            id="notify-complete"
            checked={notifyOnComplete}
            onCheckedChange={setNotifyOnComplete}
          />
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isProcessingNextStep}
          >
            {translations.back || "Back"}
          </Button>
        )}
        
        <Button
          onClick={() => onStartConversion()}
          disabled={isProcessingNextStep || !selectedVoice}
        >
          {isProcessingNextStep ? (translations.starting || "Starting...") : (translations.continue || "Continue")}
        </Button>
      </div>
    </div>
  );
};

export default VoiceSettings;
