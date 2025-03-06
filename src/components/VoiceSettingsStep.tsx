
import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import VoiceSelector from '@/components/VoiceSelector';

interface VoiceSettingsStepProps {
  detectedLanguage: string;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  notifyOnComplete: boolean;
  setNotifyOnComplete: (notify: boolean) => void;
  onNextStep: () => Promise<boolean>;
}

const VoiceSettingsStep = ({
  detectedLanguage,
  selectedVoice,
  setSelectedVoice,
  notifyOnComplete,
  setNotifyOnComplete,
  onNextStep
}: VoiceSettingsStepProps) => {
  const { translations } = useLanguage();
  const { user } = useAuth();

  const handleContinue = async (e: React.MouseEvent) => {
    // Prevent default to avoid form submissions
    e.preventDefault();
    e.stopPropagation();
    
    console.log('VoiceSettingsStep - handleContinue called');
    await onNextStep();
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col items-center text-center mb-6">
        <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200">
          {translations.voiceSettings || "Voice Settings"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {translations.voiceSettingsDesc || "Choose a voice and other conversion settings"}
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <VoiceSelector
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            detectedLanguage={detectedLanguage}
          />

          <div className="space-y-4 mt-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
            {/* Removed chapter detection toggle */}

            {user && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notify-complete" className="text-sm font-medium">
                    {translations.notifyOnComplete || "Notify on complete"}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {translations.notifyOnCompleteDesc || "Send an email notification when conversion is complete"}
                  </p>
                </div>
                <Switch
                  id="notify-complete"
                  checked={notifyOnComplete}
                  onCheckedChange={setNotifyOnComplete}
                />
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleContinue}
          className="flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
          disabled={!selectedVoice}
          type="button"
        >
          {translations.continue || "Continue"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default VoiceSettingsStep;
