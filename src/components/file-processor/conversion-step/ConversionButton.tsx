
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ConversionButtonProps {
  isConverting: boolean;
  onConvert: (e: React.MouseEvent) => void;
}

const ConversionButton: React.FC<ConversionButtonProps> = ({ isConverting, onConvert }) => {
  const { translations } = useLanguage();
  
  return (
    <Button
      onClick={onConvert}
      disabled={isConverting}
      type="button"
      variant="default"
      className="w-full py-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
    >
      <Play className="w-5 h-5" />
      {isConverting ? translations.starting || "Starting..." : translations.startConversion || "Start Conversion"}
    </Button>
  );
};

export default ConversionButton;
