
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';

interface ChapterDetectionToggleProps {
  detectChapters: boolean;
  onToggle: (value: boolean) => void;
  chaptersFound?: number;
}

// This component is now a stub that returns null
const ChapterDetectionToggle = ({ detectChapters, onToggle, chaptersFound = 0 }: ChapterDetectionToggleProps) => {
  return null; // Return null to completely disable this component
};

export default ChapterDetectionToggle;
