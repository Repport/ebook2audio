
import React, { useEffect } from "react";
import { RadioGroup } from "@/components/ui/radio-group";
import { useAudioPrelisten } from "@/hooks/useAudioPrelisten";
import VoiceOption from "./VoiceOption";
import { VOICES } from "@/constants/voices";

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (value: string) => void;
  detectedLanguage: string;
}

const VoiceSelector = ({ selectedVoice, onVoiceChange, detectedLanguage }: VoiceSelectorProps) => {
  const { isPlaying, playPrelisten } = useAudioPrelisten();
  
  // Map detected language to voice language with more variations
  const languageMap: Record<string, keyof typeof VOICES> = {
    'eng': 'english',
    'en': 'english',
    'english': 'english',
    'spa': 'spanish',
    'es': 'spanish',
    'spanish': 'spanish',
    'español': 'spanish',
    'fra': 'french',
    'fr': 'french',
    'french': 'french',
    'deu': 'german',
    'de': 'german',
    'german': 'german'
  };
  
  // Get the mapped language or fallback to english
  const mappedLanguage = languageMap[detectedLanguage.toLowerCase()] || 'english';
  const availableVoices = VOICES[mappedLanguage];

  // Reset selected voice when language changes
  useEffect(() => {
    if (availableVoices && availableVoices.length > 0) {
      const newVoice = availableVoices[0].id;
      onVoiceChange(newVoice);
    }
  }, [mappedLanguage, availableVoices, onVoiceChange]);

  if (!availableVoices) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <RadioGroup
        value={selectedVoice}
        onValueChange={onVoiceChange}
        className="grid grid-cols-2 gap-4"
      >
        {availableVoices.map((voice) => (
          <VoiceOption
            key={voice.id}
            voiceId={voice.id}
            label={voice.label}
            isPlaying={isPlaying === voice.id}
            onPrelisten={() => playPrelisten(voice.id, mappedLanguage)}
          />
        ))}
      </RadioGroup>
    </div>
  );
};

export default VoiceSelector;
