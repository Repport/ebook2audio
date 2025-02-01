import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useAudioPreview = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const { toast } = useToast();

  const playPreview = async (voiceId: string) => {
    setIsPlaying(voiceId);
    let audio: HTMLAudioElement | null = null;
    let audioUrl: string | null = null;
    
    try {
      console.log('Starting voice preview for:', voiceId);
      const { data, error } = await supabase.functions.invoke('preview-voice', {
        body: { voiceId }
      });

      if (error) {
        console.error('Supabase function error:', error);
        if (error.message?.includes('quota exceeded')) {
          toast({
            title: "API Quota Exceeded",
            description: "The voice preview feature is currently unavailable due to API limits. Please try again later.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      if (!data) {
        throw new Error('No audio data received');
      }

      const audioBlob = new Blob([data], { type: 'audio/mpeg' });
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

  return { isPlaying, playPreview };
};