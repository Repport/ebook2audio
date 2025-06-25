
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { prelistenVoice } from "@/services/voiceService";
import { DEFAULT_PREVIEW_TEXTS } from "@/constants/voices";

export const useAudioPrelisten = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const { toast } = useToast();

  const playPrelisten = async (voiceId: string, language: string = 'english') => {
    console.log('Starting voice prelisten for:', voiceId, 'in language:', language);
    setIsPlaying(voiceId);
    let audio: HTMLAudioElement | null = null;
    let audioUrl: string | null = null;
    
    try {
      const previewText = DEFAULT_PREVIEW_TEXTS[language as keyof typeof DEFAULT_PREVIEW_TEXTS] || 
                         DEFAULT_PREVIEW_TEXTS.english;
      
      console.log('Calling voice service with preview text:', previewText);
      const data = await prelistenVoice(voiceId, previewText);
      
      if (!data.audioContent) {
        throw new Error('No audio content received from service');
      }

      console.log('Audio content received, creating blob...');
      
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
          title: "Error de reproducción",
          description: "No se pudo reproducir la muestra de voz. Inténtalo de nuevo.",
          variant: "destructive",
        });
      };

      console.log('Starting audio playback...');
      await audio.play();
      console.log('Audio playback started successfully');
      
    } catch (error) {
      console.error('Voice prelisten error:', error);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setIsPlaying(null);

      let errorMessage = "Error al reproducir la muestra de voz.";
      
      if (error.message?.includes('quota exceeded') || error.message?.includes('billing')) {
        errorMessage = "El servicio de voz no está disponible. Revisa la configuración de facturación de Google Cloud.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Error de conexión. Verifica tu conexión a internet.";
      }

      toast({
        title: "Error al reproducir voz",
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
