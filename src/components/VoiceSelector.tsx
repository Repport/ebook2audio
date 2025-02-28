
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
      console.log('VoiceSelector - Setting initial voice:', newVoice);
      onVoiceChange(newVoice);
    }
  }, [mappedLanguage, availableVoices, onVoiceChange]);

  // Asegurar que siempre tengamos una voz seleccionada si hay voces disponibles
  useEffect(() => {
    if (!selectedVoice && availableVoices && availableVoices.length > 0) {
      const newVoice = availableVoices[0].id;
      console.log('VoiceSelector - No voice selected, setting default:', newVoice);
      onVoiceChange(newVoice);
    }
  }, [selectedVoice, availableVoices, onVoiceChange]);

  const handleVoiceChange = (value: string) => {
    console.log('VoiceSelector - Voice selected manually:', value);
    onVoiceChange(value);
  };

  if (!availableVoices) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <RadioGroup
        value={selectedVoice}
        onValueChange={handleVoiceChange}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
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
