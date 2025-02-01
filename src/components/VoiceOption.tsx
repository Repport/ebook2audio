import React from 'react';
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface VoiceOptionProps {
  voiceId: string;
  label: string;
  isPlaying: boolean;
  onPreview: () => void;
}

const VoiceOption = ({ voiceId, label, isPlaying, onPreview }: VoiceOptionProps) => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value={voiceId} id={voiceId} />
        <Label htmlFor={voiceId} className="text-sm font-normal">{label}</Label>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onPreview}
        disabled={isPlaying}
      >
        <Volume2 className="w-4 h-4 mr-1" />
        {isPlaying ? "Playing..." : "Preview"}
      </Button>
    </div>
  );
};

export default VoiceOption;