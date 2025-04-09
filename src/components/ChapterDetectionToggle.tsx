
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';

interface ChapterDetectionToggleProps {
  detectChapters: boolean;
  onToggle: (value: boolean) => void;
  chaptersFound?: number;
}

// This component is completely disabled and returns null
const ChapterDetectionToggle = ({ detectChapters, onToggle, chaptersFound = 0 }: ChapterDetectionToggleProps) => {
  return null;
};

export default ChapterDetectionToggle;
