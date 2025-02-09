
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
    <div className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-2 mb-2">
        <RadioGroupItem value={voiceId} id={voiceId} />
        <Label htmlFor={voiceId} className="text-sm font-medium">{label}</Label>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onPrelisten}
        disabled={isPlaying}
        className="w-full"
      >
        <Volume2 className="w-4 h-4 mr-1" />
        {isPlaying ? "Playing..." : "Prelisten"}
      </Button>
    </div>
  );
};

export default VoiceOption;
