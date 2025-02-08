
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAudioPreview } from "@/hooks/useAudioPreview";
import VoiceOption from "./VoiceOption";
import { VOICES } from "@/constants/voices";

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (value: string) => void;
  detectedLanguage: string;
}

const VoiceSelector = ({ selectedVoice, onVoiceChange, detectedLanguage }: VoiceSelectorProps) => {
  const { isPlaying, playPreview } = useAudioPreview();

  // Get available voices for the detected language or fallback to English
  const availableVoices = VOICES[detectedLanguage as keyof typeof VOICES] || VOICES.english;

  return (
    <div className="w-full max-w-xl mx-auto">
      <Label className="text-base font-medium mb-4 block text-center">
        Select Voice Type ({detectedLanguage.charAt(0).toUpperCase() + detectedLanguage.slice(1)})
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
            onPreview={() => playPreview(voice.id, detectedLanguage)}
          />
        ))}
      </RadioGroup>
    </div>
  );
};

export default VoiceSelector;
