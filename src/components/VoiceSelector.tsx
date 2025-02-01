import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Volume2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (value: string) => void;
}

const VoiceSelector = ({ selectedVoice, onVoiceChange }: VoiceSelectorProps) => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const { toast } = useToast();

  const previewVoice = async (voiceId: string, name: string) => {
    setIsPlaying(voiceId);
    let audio: HTMLAudioElement | null = null;
    let audioUrl: string | null = null;
    
    try {
      console.log('Starting voice preview for:', voiceId)
      const { data, error } = await supabase.functions.invoke('preview-voice', {
        body: { voiceId }
      })

      if (error) {
        console.error('Supabase function error:', error)
        if (error.message?.includes('quota exceeded')) {
          toast({
            title: "API Quota Exceeded",
            description: "The voice preview feature is currently unavailable due to API limits. Please try again later.",
            variant: "destructive",
          });
        } else {
          throw error
        }
        return
      }

      if (!data) {
        throw new Error('No audio data received')
      }

      // Create blob directly from the response data
      const audioBlob = new Blob([data], { type: 'audio/mpeg' });
      audioUrl = URL.createObjectURL(audioBlob);
      
      audio = new Audio(audioUrl);
      
      // Set up event handlers before playing
      audio.onended = () => {
        console.log('Audio playback completed successfully');
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        setIsPlaying(null);
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        setIsPlaying(null);
        toast({
          title: "Preview Failed",
          description: "Failed to play voice preview. Please try again.",
          variant: "destructive",
        });
      };

      // Load and play the audio
      await audio.play();
      console.log('Audio playback started successfully');
    } catch (error) {
      console.error('Preview voice error:', error);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setIsPlaying(null);
      toast({
        title: "Preview Failed",
        description: "Failed to play voice preview. Please try again.",
        variant: "destructive",
      });
      
      if (audio) {
        audio.pause();
        audio.src = '';
      }
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
  );
};

export default VoiceSelector;