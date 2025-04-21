
import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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

interface VoiceSelectorProps {
  voices?: VoiceOption[];
  selectedVoice: string | null;
  onVoiceChange: (voiceId: string) => void;
  onVoiceSelect?: (voiceId: string) => void; // For backward compatibility
  disabled?: boolean;
}

export default function VoiceSelector({
  voices: propVoices,
  selectedVoice,
  onVoiceChange,
  onVoiceSelect, // Optional prop for backward compatibility
  disabled = false,
}: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const { translations } = useLanguage();
  const { voices: hookVoices } = useVoices();
  
  // Use provided voices or fall back to the ones from the hook
  // Ensure both are properly checked for being arrays
  const availablePropVoices = Array.isArray(propVoices) ? propVoices : [];
  const availableHookVoices = Array.isArray(hookVoices) ? hookVoices : [];
  
  // Use provided voices or fall back to the ones from the hook
  const voices = availablePropVoices.length > 0 ? availablePropVoices : availableHookVoices;
  
  // Make sure voices is always an array, even if it's undefined
  const safeVoices = Array.isArray(voices) ? voices : [];
  
  // Find the currently selected voice
  const currentVoice = safeVoices.find((voice) => voice.id === selectedVoice);

  // Handle voice selection, supporting both callback patterns
  const handleVoiceSelect = (voiceId: string) => {
    onVoiceChange(voiceId);
    if (onVoiceSelect) {
      onVoiceSelect(voiceId);
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
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedVoice === voice.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {voice.name} ({voice.language})
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
