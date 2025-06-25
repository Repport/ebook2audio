
import React, { useState } from "react";
import { Check, ChevronsUpDown, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { VoiceOption } from "@/types/conversion";
import { useLanguage } from "@/hooks/useLanguage";
import { useVoices } from "@/hooks/useVoices";
import { useAudioPrelisten } from "@/hooks/useAudioPrelisten";

interface VoiceSelectorProps {
  voices?: VoiceOption[];
  selectedVoice: string | null;
  onVoiceChange: (voiceId: string) => void;
  onVoiceSelect?: (voiceId: string) => void;
  disabled?: boolean;
  detectedLanguage?: string;
}

export default function VoiceSelector({
  voices: propVoices,
  selectedVoice,
  onVoiceChange,
  onVoiceSelect,
  disabled = false,
  detectedLanguage = 'english'
}: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const { translations } = useLanguage();
  const { voices: hookVoices } = useVoices(detectedLanguage);
  const { isPlaying, playPrelisten } = useAudioPrelisten();
  
  // Use provided voices or fall back to the ones from the hook
  const availablePropVoices = Array.isArray(propVoices) ? propVoices : [];
  const availableHookVoices = Array.isArray(hookVoices) ? hookVoices : [];
  
  const voices = availablePropVoices.length > 0 ? availablePropVoices : availableHookVoices;
  const safeVoices = Array.isArray(voices) ? voices : [];
  
  // Find the currently selected voice
  const currentVoice = safeVoices.find((voice) => voice.id === selectedVoice);

  // Handle voice selection, supporting both callback patterns
  const handleVoiceSelect = (voiceId: string) => {
    console.log('Voice selected:', voiceId);
    onVoiceChange(voiceId);
    if (onVoiceSelect) {
      onVoiceSelect(voiceId);
    }
  };

  const handlePrelisten = async (voiceId: string, event: React.MouseEvent) => {
    console.log('Prelisten requested for voice:', voiceId);
    event.stopPropagation();
    try {
      await playPrelisten(voiceId, detectedLanguage);
    } catch (error) {
      console.error('Error during prelisten:', error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {currentVoice ? currentVoice.name : translations.selectVoice || "Select voice"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search voices..." />
          <CommandEmpty>No voice found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {safeVoices.length > 0 ? (
                safeVoices.map((voice) => (
                  <CommandItem
                    key={voice.id}
                    value={voice.id}
                    onSelect={() => {
                      handleVoiceSelect(voice.id);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedVoice === voice.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {voice.name} ({voice.language})
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handlePrelisten(voice.id, e)}
                      disabled={isPlaying === voice.id}
                      className="ml-2 p-1 h-8 w-8"
                      type="button"
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                  </CommandItem>
                ))
              ) : (
                <CommandItem disabled>No voices available</CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
