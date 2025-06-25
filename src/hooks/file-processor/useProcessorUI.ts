
import { useState } from 'react';

export const useProcessorUI = () => {
  const [activeTab, setActiveTab] = useState<string>("file-info");
  
  const goToNextTab = () => {
    if (activeTab === "file-info") {
      setActiveTab("voice-settings");
    } else if (activeTab === "voice-settings") {
      setActiveTab("conversion");
    }
  };

  const goToPreviousTab = () => {
    if (activeTab === "conversion") {
      setActiveTab("voice-settings");
    } else if (activeTab === "voice-settings") {
      setActiveTab("file-info");
    }
  };

  return {
    activeTab,
    setActiveTab,
    goToNextTab,
    goToPreviousTab
  };
};
