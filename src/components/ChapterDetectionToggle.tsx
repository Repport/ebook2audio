
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ChapterDetectionToggleProps {
  detectChapters: boolean;
  onToggle: (value: boolean) => void;
  chaptersFound?: number;
}

const ChapterDetectionToggle = ({ detectChapters, onToggle, chaptersFound = 0 }: ChapterDetectionToggleProps) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <Switch
        id="chapter-detection"
        checked={detectChapters}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="chapter-detection" className="flex items-center space-x-2">
        <span>Detect and mark chapters in audio</span>
        {chaptersFound > 0 && (
          <span className="text-sm text-gray-500">
            ({chaptersFound} chapters found)
          </span>
        )}
      </Label>
    </div>
  );
};

export default ChapterDetectionToggle;
