import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ChapterDetectionToggleProps {
  detectChapters: boolean;
  onToggle: (value: boolean) => void;
}

const ChapterDetectionToggle = ({ detectChapters, onToggle }: ChapterDetectionToggleProps) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <Switch
        id="chapter-detection"
        checked={detectChapters}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="chapter-detection">
        Detect and mark chapters in audio
      </Label>
    </div>
  );
};

export default ChapterDetectionToggle;