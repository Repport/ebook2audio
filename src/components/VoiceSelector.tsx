import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAudioPreview } from "@/hooks/useAudioPreview";
import VoiceOption from "./VoiceOption";

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (value: string) => void;
}

const VoiceSelector = ({ selectedVoice, onVoiceChange }: VoiceSelectorProps) => {
  const { isPlaying, playPreview } = useAudioPreview();

  const voices = [
    { id: "EXAVITQu4vr4xnSDxMaL", label: "Female (Sarah)" },
    { id: "IKne3meq5aSn9XLyUdCD", label: "Male (Charlie)" }
  ];

  return (
    <div className="w-full max-w-xl mx-auto">
      <Label className="text-base font-medium mb-4 block text-center">Select Voice Type</Label>
      <RadioGroup
        defaultValue={selectedVoice}
        onValueChange={onVoiceChange}
        className="flex flex-col items-center gap-4"
      >
        {voices.map((voice) => (
          <VoiceOption
            key={voice.id}
            voiceId={voice.id}
            label={voice.label}
            isPlaying={isPlaying === voice.id}
            onPreview={() => playPreview(voice.id)}
          />
        ))}
      </RadioGroup>
    </div>
  );
};

export default VoiceSelector;