
import { useState } from 'react';

export function useProcessorUI() {
  const [activeTab, setActiveTab] = useState<string>("file-info");
  const [isProcessingNextStep, setIsProcessingNextStep] = useState(false);
  const [detectChapters, setDetectChapters] = useState(true);
  const [isDetectingChapters, setIsDetectingChapters] = useState(false);
  
  return {
    activeTab,
    setActiveTab,
    isProcessingNextStep,
    setIsProcessingNextStep,
    detectChapters,
    setDetectChapters,
    isDetectingChapters,
    setIsDetectingChapters
  };
}
