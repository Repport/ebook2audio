
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from "@/hooks/useLanguage";
import { useFileProcessor } from '@/context/FileProcessorContext';

interface BackButtonProps {
  conversionStatus: 'idle' | 'converting' | 'completed' | 'error';
  detectingChapters: boolean;
  isProcessingNextStep: boolean;
  resetConversion: () => void;
  onGoBack: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({
  conversionStatus,
  detectingChapters,
  isProcessingNextStep,
  resetConversion,
  onGoBack
}) => {
  const { translations } = useLanguage();
  
  return (
    <div className="mb-4">
      <Button 
        variant="ghost" 
        onClick={onGoBack}
        disabled={conversionStatus === 'converting' || detectingChapters || isProcessingNextStep}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        <ArrowLeft className="w-4 h-4" />
        {translations.back || "Back"}
      </Button>
    </div>
  );
};

export default BackButton;
