
import { useCallback } from 'react';
import { Chapter } from '@/utils/textExtraction';
import { useConversionInitiation } from './useConversionInitiation';
import { useConversionValidation } from './useConversionValidation';
import { useConversionProcess } from './useConversionProcess';
import { useDownloadHandling } from './useDownloadHandling';

export interface ConversionOptions {
  selectedVoice: string;
  notifyOnComplete?: boolean;
}

export const useConversionActions = (
  selectedFile: File | null,
  extractedText: string,
  audioConversion: any,
  checkTermsAcceptance: () => Promise<boolean>,
  setShowTerms: (show: boolean) => void,
  setDetectingChapters: (detecting: boolean) => void,
  detectChapters: boolean,
  chapters: Chapter[]
) => {
  // Use our smaller, focused hooks
  const { initiateConversion } = useConversionInitiation();
  const { validateConversionParams } = useConversionValidation();
  const { startConversion } = useConversionProcess();
  const { handleDownload } = useDownloadHandling();
  
  const handleAcceptTerms = useCallback(async (options: ConversionOptions) => {
    console.log('useConversionActions - handleAcceptTerms called with options:', options);
    
    // Validate required parameters
    if (!validateConversionParams(selectedFile, extractedText, options.selectedVoice)) {
      return;
    }

    // Make sure we're not in chapter detection state
    setDetectingChapters(false);
    
    // Start the conversion process
    await startConversion(
      audioConversion,
      selectedFile,
      extractedText,
      options,
      detectChapters,
      chapters
    );
  }, [
    selectedFile, 
    extractedText, 
    validateConversionParams, 
    setDetectingChapters, 
    startConversion, 
    audioConversion, 
    detectChapters, 
    chapters
  ]);

  const handleDownloadClick = useCallback(() => {
    console.log('useConversionActions - handleDownloadClick called');
    handleDownload(audioConversion, selectedFile);
  }, [audioConversion, selectedFile, handleDownload]);

  const initiateConversionWrapper = useCallback(async () => {
    return initiateConversion(
      selectedFile,
      extractedText,
      audioConversion,
      checkTermsAcceptance,
      setShowTerms
    );
  }, [
    selectedFile,
    extractedText,
    audioConversion,
    checkTermsAcceptance,
    setShowTerms,
    initiateConversion
  ]);

  return {
    initiateConversion: initiateConversionWrapper,
    handleAcceptTerms,
    handleDownloadClick
  };
};
