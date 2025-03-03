
import { useState } from 'react';

export function useProcessorUI() {
  const [activeTab, setActiveTab] = useState<string>("file-info");
  const [isProcessingNextStep, setIsProcessingNextStep] = useState(false);
  
  return {
    activeTab,
    setActiveTab,
    isProcessingNextStep,
    setIsProcessingNextStep
  };
}
