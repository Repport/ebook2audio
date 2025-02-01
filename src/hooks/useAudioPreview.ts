import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { previewVoice } from "@/services/voiceService";

export const useAudioPreview = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const { toast } = useToast();

  const playPreview = async (voiceId: string) => {
    setIsPlaying(voiceId);
    let audio: HTMLAudioElement | null = null;
    let audioUrl: string | null = null;
    
    try {
      console.log('Starting voice preview for:', voiceId);
      const data = await previewVoice(voiceId);

      // Convert base64 to blob
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      
      // Create URL and audio element
      audioUrl = URL.createObjectURL(audioBlob);
      audio = new Audio(audioUrl);
      
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

      await audio.play();
      console.log('Audio playback started successfully');
    } catch (error) {
      console.error('Preview voice error:', error);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setIsPlaying(null);

      const errorMessage = error.message?.includes('quota exceeded')
        ? "The voice preview feature is currently unavailable due to API limits. Please try again later."
        : "Failed to play voice preview. Please try again.";

      toast({
        title: "Preview Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    }
  };

  return { isPlaying, playPreview };
};