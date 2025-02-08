
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { prelistenVoice } from "@/services/voiceService";
import { DEFAULT_PREVIEW_TEXTS } from "@/constants/voices";

export const useAudioPrelisten = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const { toast } = useToast();

  const playPrelisten = async (voiceId: string, language: string = 'english') => {
    setIsPlaying(voiceId);
    let audio: HTMLAudioElement | null = null;
    let audioUrl: string | null = null;
    
    try {
      console.log('Starting voice prelisten for:', voiceId, 'in language:', language);
      const previewText = DEFAULT_PREVIEW_TEXTS[language as keyof typeof DEFAULT_PREVIEW_TEXTS] || 
                         DEFAULT_PREVIEW_TEXTS.english;
      
      const data = await prelistenVoice(voiceId, previewText);
      
      if (!data.audioContent) {
        throw new Error('No audio content received');
      }

      // Convert base64 to blob
      const binaryString = window.atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      
      // Create URL and audio element
      audioUrl = URL.createObjectURL(audioBlob);
      audio = new Audio(audioUrl);
      
      audio.onended = () => {
        console.log('Audio playback completed');
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
          title: "Prelisten Failed",
          description: "Failed to play voice sample. Please try again.",
          variant: "destructive",
        });
      };

      console.log('Starting audio playback');
      await audio.play();
      console.log('Audio playback started successfully');
    } catch (error) {
      console.error('Prelisten voice error:', error);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setIsPlaying(null);

      const errorMessage = error.message?.includes('quota exceeded')
        ? "The voice prelisten feature is currently unavailable due to API limits. Please try again later."
        : "Failed to play voice sample. Please try again.";

      toast({
        title: "Prelisten Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    }
  };

  return { isPlaying, playPrelisten };
};
