
import React from 'react';
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface VoiceOptionProps {
  voiceId: string;
  label: string;
  isPlaying: boolean;
  onPrelisten: () => void;
}

const VoiceOption = ({ voiceId, label, isPlaying, onPrelisten }: VoiceOptionProps) => {
  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
      <div className="flex items-center gap-2">
        <div className="relative">
          <RadioGroupItem value={voiceId} id={voiceId} className="peer sr-only" />
          <Label 
            htmlFor={voiceId} 
            className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer"
          >
            <span className="w-3 h-3 rounded-full bg-transparent peer-data-[state=checked]:bg-primary"></span>
          </Label>
        </div>
        <Label htmlFor={voiceId} className="text-sm font-medium cursor-pointer text-gray-700 dark:text-gray-300">{label}</Label>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onPrelisten}
        disabled={isPlaying}
        className="w-full hover:text-primary dark:hover:text-primary-foreground dark:hover:bg-gray-800 rounded-full transition-colors text-xs"
      >
        <Volume2 className="w-3 h-3 mr-1" />
        {isPlaying ? "Playing..." : "Listen"}
      </Button>
    </div>
  );
};

export default VoiceOption;
