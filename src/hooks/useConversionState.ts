
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Chapter } from '@/utils/textExtraction';

export const useConversionState = () => {
  const [detectChapters, setDetectChapters] = useState(true);
  const [detectingChapters, setDetectingChapters] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const initiateConversion = (selectedFile: File | null, extractedText: string) => {
    if (!selectedFile || !extractedText) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleViewConversions = () => {
    navigate('/conversions');
  };

  return {
    detectChapters,
    setDetectChapters,
    detectingChapters,
    setDetectingChapters,
    showTerms,
    setShowTerms,
    initiateConversion,
    handleViewConversions,
    toast
  };
};
