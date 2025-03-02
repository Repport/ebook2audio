
import React, { useState } from 'react';
import VoiceSelector from '@/components/VoiceSelector';
import ChapterDetectionToggle from '@/components/ChapterDetectionToggle';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from '@/hooks/use-toast';

interface VoiceSettingsStepProps {
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  detectedLanguage: string;
  detectChapters: boolean;
  setDetectChapters: (detect: boolean) => void;
  notifyOnComplete: boolean;
  setNotifyOnComplete: (notify: boolean) => void;
  onNextStep: () => Promise<boolean>;
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
  const { translations } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleContinue = async () => {
    // Evitar múltiples clics
    if (isProcessing) return;
    
    console.log('VoiceSettingsStep - handleContinue clicked with voice:', selectedVoice);
    
    if (!selectedVoice) {
      toast({
        title: "Error",
        description: "Please select a voice before continuing",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const result = await onNextStep();
      console.log('VoiceSettingsStep - onNextStep result:', result);
      
      if (!result) {
        toast({
          title: "Error",
          description: "Could not proceed to the next step",
          variant: "destructive"
        });
      }
      
      return result;
    } catch (error) {
      console.error('VoiceSettingsStep - Error in handleContinue:', error);
      toast({
        title: "Error",
        description: "An error occurred while trying to continue",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="space-y-8 animate-fade-up">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-center mb-1 text-gray-800 dark:text-gray-200">
          {translations.selectVoiceType || "Select Voice Type"}
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
          {translations.voiceDescription || "Choose the voice that will read your text"}
        </p>
      </div>
      
      <VoiceSelector 
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        detectedLanguage={detectedLanguage}
      />
      
      <div className="space-y-6 mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div>
          <ChapterDetectionToggle 
            detectChapters={detectChapters}
            onToggle={setDetectChapters}
            chaptersFound={0}
          />
        </div>

        {user && (
          <div className="flex items-center justify-between space-x-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Label htmlFor="notify-complete" className="text-gray-700 dark:text-gray-300 cursor-pointer">
              {translations.notifyWhenComplete || "Notify me when complete"}
            </Label>
            <Switch
              id="notify-complete"
              checked={notifyOnComplete}
              onCheckedChange={setNotifyOnComplete}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end mt-8">
        <Button
          onClick={handleContinue}
          disabled={isProcessing || !selectedVoice}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white dark:text-primary-foreground rounded-full px-6"
        >
          {isProcessing ? (
            <span>Processing...</span>
          ) : (
            <>
              {translations.continue || "Continue"}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default VoiceSettingsStep;
