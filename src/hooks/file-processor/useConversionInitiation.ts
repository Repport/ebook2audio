
import { useCallback } from 'react';
import { useConversionStore } from '@/store/conversionStore';
import { clearConversionStorage } from '@/services/storage/conversionStorageService';

export function useConversionInitiation() {
  const conversionStore = useConversionStore();
  
  const initiateConversion = useCallback(async (
    selectedFile: File | null,
    extractedText: string,
    audioConversion: any,
    checkTermsAcceptance: () => Promise<boolean>,
    setShowTerms: (show: boolean) => void
  ) => {
    console.log('useConversionInitiation - initiateConversion called');
    
    if (!selectedFile || !extractedText) {
      console.log('useConversionInitiation - Missing file or text');
      return false;
    }
    
    try {
      console.log('useConversionInitiation - Checking terms acceptance');
      
      // For debugging, reset conversion state here
      audioConversion.resetConversion();
      conversionStore.resetConversion();
      clearConversionStorage();
      
      const termsAccepted = await checkTermsAcceptance();
      if (!termsAccepted) {
        setShowTerms(true);
        return true; // We're showing terms, so this is a successful flow
      }
      
      return true;
    } catch (err) {
      console.error('useConversionInitiation - Error in terms acceptance check:', err);
      setShowTerms(true);
      return false;
    }
  }, [conversionStore]);
  
  return {
    initiateConversion
  };
}
