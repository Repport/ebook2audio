
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';

interface ChapterDetectionToggleProps {
  detectChapters: boolean;
  onToggle: (value: boolean) => void;
  chaptersFound?: number;
}

const ChapterDetectionToggle = ({ detectChapters, onToggle, chaptersFound = 0 }: ChapterDetectionToggleProps) => {
  const { translations } = useLanguage();

  const handleToggle = (checked: boolean) => {
    console.log('ChapterDetectionToggle - toggled to:', checked);
    onToggle(checked);
  };

  return (
    <div className="flex items-center justify-between space-x-2">
      <Label htmlFor="chapter-detection" className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 cursor-pointer">
        <span>{translations.detectChapters || "Detect and mark chapters in audio"}</span>
        {chaptersFound > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({chaptersFound} {translations.chaptersFound || "chapters found"})
          </span>
        )}
      </Label>
      <Switch
        id="chapter-detection"
        checked={detectChapters}
        onCheckedChange={handleToggle}
      />
    </div>
  );
};

export default ChapterDetectionToggle;
