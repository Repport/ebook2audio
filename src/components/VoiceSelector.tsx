
import React, { useState, useEffect } from 'react';
import { Check, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { VoiceOption } from '@/types/conversion';
import { supabase } from '@/integrations/supabase/client';

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceSelect?: (voiceId: string) => void;
  onVoiceChange?: (voiceId: string) => void;
  detectedLanguage?: string;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ 
  selectedVoice, 
  onVoiceSelect, 
  onVoiceChange,
  detectedLanguage 
}) => {
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // For this simplified example, we'll use a hardcoded list of Google TTS voices
    // In a real app, you might want to fetch this from an API or backend
    const defaultVoices: VoiceOption[] = [
      { id: 'es-US-Standard-A', name: 'Sofia', language: 'Spanish (US)' },
      { id: 'es-US-Standard-B', name: 'Pedro', language: 'Spanish (US)' },
      { id: 'es-US-Wavenet-A', name: 'Sofia (HD)', language: 'Spanish (US)' },
      { id: 'es-US-Wavenet-B', name: 'Pedro (HD)', language: 'Spanish (US)' },
      { id: 'en-US-Standard-A', name: 'Allison', language: 'English (US)' },
      { id: 'en-US-Standard-B', name: 'George', language: 'English (US)' },
      { id: 'en-US-Wavenet-A', name: 'Allison (HD)', language: 'English (US)' },
      { id: 'en-US-Wavenet-B', name: 'George (HD)', language: 'English (US)' },
    ];
    
    setVoices(defaultVoices);
    setLoading(false);
  }, []);
  
  const handlePlayPreview = async (voiceId: string) => {
    try {
      if (playingPreview === voiceId) {
        // Stop playback if clicking the same voice
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setPlayingPreview(null);
        return;
      }
      
      setPlayingPreview(voiceId);
      
      // Call the edge function to get a preview
      const { data, error } = await supabase.functions.invoke('preview-voice', {
        body: { voiceId }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data?.audioContent) {
        throw new Error('No audio content received');
      }
      
      // Create an audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.onended = () => {
          setPlayingPreview(null);
        };
      }
      
      // Convert base64 to blob URL
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes.buffer], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      
      // Play the audio
      audioRef.current.src = url;
      audioRef.current.play().catch(e => {
        console.error('Error playing audio:', e);
        setPlayingPreview(null);
      });
      
      // Clean up URL when done
      audioRef.current.onended = () => {
        URL.revokeObjectURL(url);
        setPlayingPreview(null);
      };
    } catch (err) {
      console.error('Error playing voice preview:', err);
      setPlayingPreview(null);
      setError(err instanceof Error ? err.message : 'Failed to play preview');
    }
  };
  
  // Find selected voice name
  const selectedVoiceName = selectedVoice 
    ? voices.find(v => v.id === selectedVoice)?.name || 'Select a voice'
    : 'Select a voice';
  
  // Handle voice selection with proper callback
  const handleVoiceSelect = (voiceId: string) => {
    if (onVoiceSelect) {
      onVoiceSelect(voiceId);
    }
    if (onVoiceChange) {
      onVoiceChange(voiceId);
    }
    setOpen(false);
  };
  
  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedVoice ? selectedVoiceName : "Select a voice..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search voices..." />
            <CommandEmpty>No voice found.</CommandEmpty>
            {loading ? (
              <div className="py-6 text-center text-sm">Loading voices...</div>
            ) : (
              <CommandGroup>
                {voices.map((voice) => (
                  <CommandItem
                    key={voice.id}
                    value={voice.id}
                    onSelect={() => handleVoiceSelect(voice.id)}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className={cn(
                        "mr-2",
                        selectedVoice === voice.id ? "opacity-100" : "opacity-0"
                      )}>
                        <Check className="h-4 w-4" />
                      </span>
                      {voice.name} 
                      <span className="ml-2 text-muted-foreground text-xs">
                        {voice.language}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPreview(voice.id);
                      }}
                    >
                      {playingPreview === voice.id ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      
      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}
    </div>
  );
};

export default VoiceSelector;
