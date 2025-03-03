
import React from 'react';
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from '../ui/spinner';
import { useLanguage } from "@/hooks/useLanguage";

interface ChapterDetectionStateProps {
  onSkip: () => void;
}

const ChapterDetectionState: React.FC<ChapterDetectionStateProps> = ({ onSkip }) => {
  const { translations } = useLanguage();
  
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
      <LoadingSpinner size="lg" />
      <p className="text-lg mt-4 text-gray-700 dark:text-gray-300">
        {translations.detectingChapters || "Detecting chapters..."}
      </p>
      <Button 
        variant="outline" 
        className="mt-4 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" 
        onClick={onSkip}
      >
        Skip chapter detection
      </Button>
    </div>
  );
};

export default ChapterDetectionState;
