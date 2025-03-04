
import React from 'react';
import { useLanguage } from "@/hooks/useLanguage";

const ConversionStepTitle: React.FC = () => {
  const { translations } = useLanguage();
  
  return (
    <div className="flex flex-col items-center text-center mb-6">
      <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200">
        {translations.convertToAudio || "Convert to Audio"}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {translations.convertDesc || "Start the conversion process and download your audio"}
      </p>
    </div>
  );
};

export default ConversionStepTitle;
