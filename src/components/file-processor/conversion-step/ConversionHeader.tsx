
import React from 'react';
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ConversionHeaderProps {
  fileName: string;
  onViewConversions: () => void;
}

const ConversionHeader: React.FC<ConversionHeaderProps> = ({ fileName, onViewConversions }) => {
  const { translations } = useLanguage();
  
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">{fileName}</h3>
      <Button
        variant="outline"
        size="sm"
        onClick={onViewConversions}
        type="button"
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
      >
        <List className="w-4 h-4" />
        {translations.viewConversions || "View Conversions"}
      </Button>
    </div>
  );
};

export default ConversionHeader;
