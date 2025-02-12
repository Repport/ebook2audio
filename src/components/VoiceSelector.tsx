
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  
  // Map detected language to voice language
  const languageMap: Record<string, keyof typeof VOICES> = {
    'eng': 'english',
    'en': 'english',
    'spa': 'spanish',
    'es': 'spanish',
    'fra': 'french',
    'fr': 'french',
    'deu': 'german',
    'de': 'german'
  };

  // Get the mapped language or fallback to english
  const mappedLanguage = languageMap[detectedLanguage.toLowerCase()] || 'english';
  const availableVoices = VOICES[mappedLanguage];

  return (
    <div className="w-full max-w-xl mx-auto">
      <Label className="text-base font-medium mb-4 block text-center">
        Select Voice Type ({mappedLanguage.charAt(0).toUpperCase() + mappedLanguage.slice(1)})
      </Label>
      <RadioGroup
        defaultValue={selectedVoice}
        onValueChange={onVoiceChange}
        className="flex justify-center gap-6"
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
