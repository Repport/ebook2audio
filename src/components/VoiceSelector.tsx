
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

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoice: string | null;
  onVoiceChange: (voiceId: string) => void;
  disabled?: boolean;
}

export default function VoiceSelector({
  voices = [],
  selectedVoice,
  onVoiceChange,
  disabled = false,
}: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const { translations } = useLanguage();

  // Make sure voices is always an array, even if it's undefined
  const safeVoices = Array.isArray(voices) ? voices : [];
  
  // Find the currently selected voice
  const currentVoice = safeVoices.find((voice) => voice.id === selectedVoice);

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
          {currentVoice ? currentVoice.name : translations.selectVoice}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search voices..." />
          <CommandEmpty>No voice found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {safeVoices.map((voice) => (
                <CommandItem
                  key={voice.id}
                  value={voice.id}
                  onSelect={() => {
                    onVoiceChange(voice.id);
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
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
