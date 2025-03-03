
import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/hooks/useLanguage";
import { useFileProcessor } from '@/context/FileProcessorContext';

const ProcessorTabs: React.FC = () => {
  const { translations } = useLanguage();
  const { currentStep } = useFileProcessor();
  
  return (
    <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
      <TabsTrigger 
        value="file-info" 
        disabled={currentStep > 2}
        className="rounded-full py-2 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-800 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
      >
        {translations.fileInfo || "File Information"}
      </TabsTrigger>
      <TabsTrigger 
        value="voice-settings" 
        disabled={currentStep < 2}
        className="rounded-full py-2 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-800 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
      >
        {translations.voiceSettings || "Voice Settings"}
      </TabsTrigger>
      <TabsTrigger 
        value="conversion" 
        disabled={currentStep < 3}
        className="rounded-full py-2 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-800 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
      >
        {translations.conversionAndDownload || "Conversion & Download"}
      </TabsTrigger>
    </TabsList>
  );
};

export default ProcessorTabs;
