
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import VoiceSelector from '@/components/VoiceSelector';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';
import { useVoices } from '@/hooks/useVoices';

interface VoiceSettingsProps {
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  notifyOnComplete: boolean;
  setNotifyOnComplete: (notify: boolean) => void;
  isProcessingNextStep?: boolean;
  onStartConversion: () => Promise<boolean>;
  onBack?: () => void;
  detectedLanguage?: string;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  selectedVoice,
  setSelectedVoice,
  notifyOnComplete,
  setNotifyOnComplete,
  isProcessingNextStep = false,
  onStartConversion,
  onBack,
  detectedLanguage = 'english'
}) => {
  const { translations } = useLanguage();
  const { voices } = useVoices(detectedLanguage);
  
  // Auto-select the first voice if none is selected and voices are available
  useEffect(() => {
    if (!selectedVoice && voices && voices.length > 0) {
      console.log('Auto-selecting first voice:', voices[0].id);
      setSelectedVoice(voices[0].id);
    }
  }, [voices, selectedVoice, setSelectedVoice]);
  
  return (
    <div className="animate-fade-up space-y-6">
      <h2 className="text-xl font-medium mb-4">
        {translations.voiceSettings || "Voice Settings"}
      </h2>
      
      <div className="space-y-6">
        <VoiceSelector
          voices={voices}
          selectedVoice={selectedVoice}
          onVoiceChange={setSelectedVoice}
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
