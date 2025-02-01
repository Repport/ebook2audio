import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (value: string) => void;
}

const VoiceSelector = ({ selectedVoice, onVoiceChange }: VoiceSelectorProps) => {
  return (
    <div className="w-full max-w-xl mx-auto">
      <Label className="text-base font-medium mb-4 block text-center">Select Voice Type</Label>
      <RadioGroup
        defaultValue={selectedVoice}
        onValueChange={onVoiceChange}
        className="flex justify-center gap-8"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="EXAVITQu4vr4xnSDxMaL" id="female" />
          <Label htmlFor="female" className="text-sm font-normal">Female (Sarah)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="IKne3meq5aSn9XLyUdCD" id="male" />
          <Label htmlFor="male" className="text-sm font-normal">Male (Charlie)</Label>
        </div>
      </RadioGroup>
    </div>
  )
}

export default VoiceSelector;