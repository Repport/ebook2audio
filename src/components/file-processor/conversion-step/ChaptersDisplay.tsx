
import React from 'react';
import { Chapter } from '@/utils/textExtraction';
import { ChaptersList } from '@/components/ChaptersList';
import { useLanguage } from "@/hooks/useLanguage";

interface ChaptersDisplayProps {
  chapters: Chapter[];
}

const ChaptersDisplay: React.FC<ChaptersDisplayProps> = ({ chapters }) => {
  const { translations } = useLanguage();
  
  if (chapters.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
      <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
        {translations.detectedChapters || "Detected Chapters"}
      </h4>
      <ChaptersList chapters={chapters} />
    </div>
  );
};

export default ChaptersDisplay;
