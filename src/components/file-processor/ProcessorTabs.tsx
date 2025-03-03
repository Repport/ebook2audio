
import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/hooks/useLanguage";
import { useFileProcessor } from '@/context/FileProcessorContext';

interface ProcessorTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const ProcessorTabs: React.FC<ProcessorTabsProps> = ({ activeTab, onTabChange }) => {
  const { translations } = useLanguage();
  const { currentStep } = useFileProcessor();
  
  const handleTabClick = (value: string) => {
    // Prevent default navigation behavior
    onTabChange(value);
  };
  
  return (
    <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
      <TabsTrigger 
        value="file-info" 
        disabled={currentStep > 2}
        className="rounded-full py-2 px-4 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
        onClick={() => handleTabClick("file-info")}
        data-state={activeTab === "file-info" ? "active" : "inactive"}
      >
        {translations.fileInfo || "File Information"}
      </TabsTrigger>
      <TabsTrigger 
        value="voice-settings" 
        disabled={currentStep < 2}
        className="rounded-full py-2 px-4 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
        onClick={() => handleTabClick("voice-settings")}
        data-state={activeTab === "voice-settings" ? "active" : "inactive"}
      >
        {translations.voiceSettings || "Voice Settings"}
      </TabsTrigger>
      <TabsTrigger 
        value="conversion" 
        disabled={currentStep < 3}
        className="rounded-full py-2 px-4 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
        onClick={() => handleTabClick("conversion")}
        data-state={activeTab === "conversion" ? "active" : "inactive"}
      >
        {translations.conversionAndDownload || "Conversion & Download"}
      </TabsTrigger>
    </TabsList>
  );
};

export default ProcessorTabs;
