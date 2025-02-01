import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Volume2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (value: string) => void;
}

const VoiceSelector = ({ selectedVoice, onVoiceChange }: VoiceSelectorProps) => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const { toast } = useToast();

  const previewVoice = async (voiceId: string, name: string) => {
    if (!process.env.ELEVEN_LABS_API_KEY) {
      toast({
        title: "API Key Missing",
        description: "Please set your Eleven Labs API key to preview voices",
        variant: "destructive",
      });
      return;
    }

    setIsPlaying(voiceId);
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVEN_LABS_API_KEY!
        },
        body: JSON.stringify({
          text: "Hello! This is a preview of my voice. I hope you like it!",
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) throw new Error('Failed to generate voice preview');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: "Failed to play voice preview. Please try again.",
        variant: "destructive",
      });
      setIsPlaying(null);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <Label className="text-base font-medium mb-4 block text-center">Select Voice Type</Label>
      <RadioGroup
        defaultValue={selectedVoice}
        onValueChange={onVoiceChange}
        className="flex flex-col items-center gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="EXAVITQu4vr4xnSDxMaL" id="female" />
            <Label htmlFor="female" className="text-sm font-normal">Female (Sarah)</Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => previewVoice("EXAVITQu4vr4xnSDxMaL", "Sarah")}
            disabled={isPlaying !== null}
          >
            <Volume2 className="w-4 h-4 mr-1" />
            {isPlaying === "EXAVITQu4vr4xnSDxMaL" ? "Playing..." : "Preview"}
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="IKne3meq5aSn9XLyUdCD" id="male" />
            <Label htmlFor="male" className="text-sm font-normal">Male (Charlie)</Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => previewVoice("IKne3meq5aSn9XLyUdCD", "Charlie")}
            disabled={isPlaying !== null}
          >
            <Volume2 className="w-4 h-4 mr-1" />
            {isPlaying === "IKne3meq5aSn9XLyUdCD" ? "Playing..." : "Preview"}
          </Button>
        </div>
      </RadioGroup>
    </div>
  )
}

export default VoiceSelector;